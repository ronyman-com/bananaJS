const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const http = require('http');
const os = require('os');

// --- Logging Setup ---
const logger = {
    info: (...args) => console.log(`[INFO]`, ...args),
    warn: (...args) => console.warn(`[WARN]`, ...args),
    error: (...args) => console.error(`[ERROR]`, ...args),
    debug: (...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG]`, ...args);
        }
    }
};

logger.info('Server script starting...');
logger.debug(`Node.js Version: ${process.version}`);
logger.debug(`Initial CWD: ${process.cwd()}`);
logger.debug(`NODE_ENV: ${process.env.NODE_ENV}`);

// --- Configuration ---
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';
const OPEN_BROWSER = process.env.OPEN_BROWSER === 'true';

// --- Directory Configuration ---
let projectRoot = process.env.PROJECT_ROOT || process.cwd();
let publicDir = process.env.PUBLIC_DIR || path.join(projectRoot, NODE_ENV === 'production' ? 'dist' : 'public');
let srcDir = process.env.SRC_DIR || (NODE_ENV === 'development' ? path.join(projectRoot, 'src') : null);

// Fallback logic for production if dist doesn't exist
if (NODE_ENV === 'production' && !fs.existsSync(publicDir)) {
    const fallbackPublic = path.join(projectRoot, 'public');
    if (fs.existsSync(fallbackPublic)) {
        logger.info(`Production 'dist' not found, falling back to 'public': ${fallbackPublic}`);
        publicDir = fallbackPublic;
    }
}

// --- Directory Verification ---
logger.info('Final Directory Configuration:');
logger.info(`- Project Root: ${projectRoot}`);
logger.info(`- Public Directory: ${publicDir}`);
if (NODE_ENV === 'development') {
    logger.info(`- Source Directory: ${srcDir || 'N/A'}`);
}

if (!fs.existsSync(publicDir)) {
    logger.error(`❌ FATAL: Public directory does not exist or is inaccessible.`);
    logger.error(`   Path checked: ${publicDir}`);
    process.exit(1);
} else {
    logger.info(`✅ Public directory verified: ${publicDir}`);
}

const srcDirExists = NODE_ENV === 'development' && srcDir && fs.existsSync(srcDir);
if (NODE_ENV === 'development') {
    if (srcDirExists) {
        logger.info(`✅ Source directory verified: ${srcDir}`);
    } else {
        logger.warn(`⚠️ Source directory not found or not applicable: ${srcDir || 'Not Defined'}`);
        logger.warn(`   HMR for source files will be disabled.`);
    }
}

// --- Load createApp ---
let createApp;
const createAppPath = path.resolve(projectRoot, './lib/create-app.cjs');
if (fs.existsSync(createAppPath)) {
    try {
        createApp = require(createAppPath);
        logger.debug(`Loaded createApp module from: ${createAppPath}`);
    } catch (err) {
        logger.error(`Error loading createApp module from ${createAppPath}:`, err);
        createApp = async () => { throw new Error('createApp module failed to load'); };
    }
} else {
    logger.warn(`createApp module not found at ${createAppPath}. API endpoint /api/create-app will not work.`);
    createApp = async () => { throw new Error('createApp module not found'); };
}

// --- Initialize Server ---
const app = express();
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Performance tracking
let buildStartTime;
let hmrUpdateTime;

// --- Middleware ---
app.use((req, res, next) => {
    buildStartTime = Date.now();
    logger.debug(`Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Static file serving
const staticOptions = {
    index: false,
    redirect: false,
    dotfiles: 'ignore',
    maxAge: NODE_ENV === 'production' ? '1y' : '0',
    fallthrough: true
};

logger.info(`Setting up static file serving from: ${publicDir}`);
app.use(express.static(publicDir, staticOptions));

if (NODE_ENV === 'development' && srcDirExists) {
    logger.info(`Setting up static file serving for /src from: ${srcDir}`);
    app.use('/src', express.static(srcDir, staticOptions));
}

// --- API Endpoints ---
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        nodeEnv: NODE_ENV,
        projectRoot: path.relative(process.cwd(), projectRoot),
        servingPublic: path.relative(process.cwd(), publicDir),
        servingSrc: NODE_ENV === 'development' && srcDirExists ? path.relative(process.cwd(), srcDir) : null,
        uptime: process.uptime()
    });
});

app.get('/api/files', (req, res) => {
    logger.debug(`GET /api/files received. Query:`, req.query);
    const { directory } = req.query;
    const baseDir = path.resolve(projectRoot, directory || '');
    logger.debug(`/api/files: Resolved base directory: ${baseDir}`);

    if (!baseDir.startsWith(projectRoot)) {
        logger.warn(`/api/files: Attempt to access directory outside project root: ${baseDir}`);
        return res.status(400).json({ success: false, message: 'Invalid directory path.' });
    }

    if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
        logger.warn(`/api/files: Directory not found or not a directory: ${baseDir}`);
        return res.status(404).json({ success: false, message: `Directory "${path.relative(projectRoot, baseDir)}" does not exist or is not a directory.` });
    }

    try {
        logger.debug(`/api/files: Reading directory: ${baseDir}`);
        const files = [];
        const items = fs.readdirSync(baseDir);
        items.forEach(item => {
            const fullPath = path.join(baseDir, item);
            try {
                const stat = fs.statSync(fullPath);
                files.push({
                    name: item,
                    path: path.relative(projectRoot, fullPath).replace(/\\/g, '/'),
                    isDirectory: stat.isDirectory()
                });
            } catch (statErr) {
                logger.error(`/api/files: Error stating file ${fullPath}:`, statErr.code || statErr.message);
            }
        });
        logger.debug(`/api/files: Sending ${files.length} items.`);
        res.json({ success: true, files });
    } catch (readErr) {
        logger.error(`/api/files: Error reading directory ${baseDir}:`, readErr);
        res.status(500).json({ success: false, message: 'Error reading directory contents.' });
    }
});

app.post('/api/create-project', (req, res) => {
    logger.debug(`POST /api/create-project received. Body:`, req.body);
    const { projectName } = req.body;
    if (!projectName || typeof projectName !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(projectName)) {
        logger.warn(`/api/create-project: Invalid project name: ${projectName}`);
        return res.status(400).json({ success: false, message: 'Invalid project name (use letters, numbers, underscore, dot, hyphen).' });
    }

    const projectDir = path.join(projectRoot, projectName);
    logger.debug(`/api/create-project: Target project directory: ${projectDir}`);

    if (fs.existsSync(projectDir)) {
        logger.warn(`/api/create-project: Project directory already exists: ${projectDir}`);
        return res.status(400).json({ success: false, message: `Project "${projectName}" already exists.` });
    }

    const templateDir = path.resolve(__dirname, '..', 'templates', 'default');
    logger.debug(`/api/create-project: Using template directory: ${templateDir}`);

    if (!fs.existsSync(templateDir)) {
        logger.error(`/api/create-project: Template directory not found at ${templateDir}`);
        return res.status(500).json({ success: false, message: 'Default project template not found on server.' });
    }

    try {
        logger.debug(`/api/create-project: Copying template from ${templateDir} to ${projectDir}`);
        fs.copySync(templateDir, projectDir);
        logger.debug(`/api/create-project: Project created successfully: ${projectName}`);
        res.json({ success: true, message: `Project "${projectName}" created successfully!` });
    } catch (copyErr) {
        logger.error(`/api/create-project: Error copying template to ${projectDir}:`, copyErr);
        res.status(500).json({ success: false, message: 'Failed to create project from template.' });
    }
});

app.post('/api/create-app', async (req, res) => {
    logger.debug(`POST /api/create-app received. Body:`, req.body);
    try {
        const { appName, template } = req.body;
        if (!appName || !template) {
            logger.warn(`/api/create-app: Missing appName or template.`);
            return res.status(400).json({ success: false, message: 'Missing appName or template in request body.' });
        }
        
        logger.debug(`/api/create-app: Calling createApp with name "${appName}" and template "${template}"`);
        const result = await createApp(appName, template);
        if (!result || typeof result.appDir !== 'string') {
            logger.error(`/api/create-app: createApp did not return expected object with appDir string. Received:`, result);
            throw new Error('Invalid response from createApp module.');
        }
        
        const { appDir } = result;
        logger.debug(`/api/create-app: createApp returned appDir: ${appDir}`);
        const relativeAppDir = path.relative(projectRoot, appDir).replace(/\\/g, '/');
        
        logger.debug(`/api/create-app: App created successfully at relative path: ${relativeAppDir}`);
        res.json({ 
            success: true, 
            message: `Created ${template} app "${appName}" at ${relativeAppDir}`, 
            path: relativeAppDir 
        });
    } catch (err) {
        logger.error("Error in /api/create-app:", err);
        res.status(500).json({ success: false, message: err.message || 'Failed to create app.' });
    }
});

// --- WebSocket and HMR ---
if (NODE_ENV === 'development') {
    logger.info('Development mode: Setting up WebSocket and HMR...');
    const watchPaths = [publicDir];
    logger.debug(`HMR: Watching public directory: ${publicDir}`);

    if (srcDirExists) {
        watchPaths.push(srcDir);
        logger.debug(`HMR: Watching source directory: ${srcDir}`);
    }

    const watcher = chokidar.watch(watchPaths, {
        ignored: /(^|[\/\\])\..*|node_modules|dist/,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 100 }
    });
    logger.debug(`HMR: Chokidar watcher initialized for paths: ${watchPaths.join(', ')}`);

    let hmrTimeout;
    const sendUpdate = (filePath) => {
        buildStartTime = buildStartTime || Date.now();
        hmrUpdateTime = Date.now() - buildStartTime;
        const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
        logger.info(`HMR: File changed: ${relativePath}, sending update...`);
        
        const message = JSON.stringify({ 
            type: 'update', 
            file: relativePath, 
            time: hmrUpdateTime 
        });
        
        let clientCount = 0;
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
                clientCount++;
            }
        });
        logger.debug(`HMR: Update sent to ${clientCount} clients.`);
        buildStartTime = Date.now();
    };

    watcher
        .on('add', filePath => { logger.debug(`HMR Event: File added - ${filePath}`); clearTimeout(hmrTimeout); hmrTimeout = setTimeout(() => sendUpdate(filePath), 75); })
        .on('change', filePath => { logger.debug(`HMR Event: File changed - ${filePath}`); clearTimeout(hmrTimeout); hmrTimeout = setTimeout(() => sendUpdate(filePath), 75); })
        .on('unlink', filePath => { logger.debug(`HMR Event: File removed - ${filePath}`); clearTimeout(hmrTimeout); hmrTimeout = setTimeout(() => sendUpdate(filePath), 75); })
        .on('error', error => logger.error(`HMR Watcher Error: ${error}`))
        .on('ready', () => logger.debug('HMR Watcher: Initial scan complete. Ready for changes.'));

    // Metrics reporting
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const metrics = {
            memory: memoryUsage.rss / 1024 / 1024,
            cpu: process.cpuUsage().user / 1000,
            buildTime: buildStartTime ? Date.now() - buildStartTime : 0,
            hmrUpdateTime: hmrUpdateTime || 0,
        };

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'metrics', data: metrics }));
            }
        });
    }, 1000);
} else {
    logger.info('Production mode: HMR disabled.');
}

// --- Routes ---
app.get('/dashboard', (req, res, next) => {
    const dashboardPath = path.join(publicDir, 'dashboard.html');
    logger.debug(`GET /dashboard: Checking for ${dashboardPath}`);
    if (fs.existsSync(dashboardPath)) {
        logger.debug(`GET /dashboard: Sending file ${dashboardPath}`);
        res.sendFile(dashboardPath);
    } else {
        logger.debug(`GET /dashboard: dashboard.html not found. Falling through.`);
        next();
    }
});

// SPA Fallback Route
app.get('*', (req, res) => {
    logger.debug(`SPA Fallback: Handling request for ${req.path}`);
    if (req.path.includes('.') && !req.path.endsWith('.html')) {
        logger.debug(`SPA Fallback: Request looks like a non-HTML file (${req.path}), sending 404.`);
        res.status(404).type('text/plain').send('Not Found');
        return;
    }

    const indexPath = path.join(publicDir, 'index.html');
    logger.debug(`SPA Fallback: Checking for index.html at ${indexPath}`);
    if (fs.existsSync(indexPath)) {
        logger.debug(`SPA Fallback: Sending index.html`);
        res.sendFile(indexPath);
    } else {
        logger.error(`SPA Fallback: index.html not found at ${indexPath}. Sending 404 page.`);
        res.status(404).type('text/html').send(`
            <h1>404 - Not Found</h1>
            <p>The requested path "${req.path}" could not be handled.</p>
            <p>The main application file (index.html) is missing from the public directory (${publicDir}).</p>
        `);
    }
});

// --- WebSocket Handling ---
wss.on('connection', (ws, req) => {
    logger.info(`WebSocket Client connected.`);
    ws.on('message', (message) => {
        logger.debug(`WebSocket received: ${message.toString()}`);
    });
    ws.on('close', (code, reason) => logger.info(`WebSocket Client disconnected. Code: ${code}, Reason: ${reason ? reason.toString() : 'N/A'}`));
    ws.on('error', (err) => logger.error('WebSocket connection error:', err));
});

wss.on('error', (error) => {
    logger.error('WebSocket Server Error:', error);
});

// --- Error Handling ---
app.use((err, req, res, next) => {
    logger.error("Unhandled Express error:", err.stack || err);
    const statusCode = err.status || 500;
    const message = NODE_ENV === 'production' ? 'Internal Server Error' : `Server Error: ${err.message}`;
    res.status(statusCode).type('text/plain').send(message);
});

// --- Helper Functions ---
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// --- Start Server ---
server.listen(PORT, HOST, () => {
    const serverUrl = `http://${HOST}:${PORT}`;
    const networkUrl = HOST === '0.0.0.0' ? `http://${getLocalIpAddress()}:${PORT}` : null;

    console.log(`\n✅ Server Started Successfully:`);
    console.log(`- Mode: ${NODE_ENV}`);
    console.log(`- Serving: ${publicDir}`);
    if (NODE_ENV === 'development' && srcDirExists) {
        console.log(`- Watching Source: ${srcDir}`);
    }
    console.log(`- Local URL:   ${serverUrl}`);
    if (networkUrl && networkUrl !== serverUrl) {
        console.log(`- Network URL: ${networkUrl}`);
    }
    console.log(`- WebSocket: ws://${HOST}:${PORT}\n`);

    if (OPEN_BROWSER && NODE_ENV === 'development') {
        logger.info(`Attempting to open browser at ${serverUrl}...`);
        import('open').then(({ default: open }) => {
            open(serverUrl).catch(err => logger.error("Failed to open browser:", err));
        }).catch(err => logger.error("Failed to dynamically import 'open' package:", err));
    }
}).on('error', (error) => {
    logger.error(`Server failed to start on ${HOST}:${PORT}:`, error);
    if (error.syscall !== 'listen') { throw error; }
    switch (error.code) {
        case 'EACCES':
            console.error(`❌ Error: Port ${PORT} requires elevated privileges or is blocked.`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`❌ Error: Port ${PORT} on host ${HOST} is already in use.`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// --- Graceful Shutdown ---
const shutdown = (signal) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    wss.close(() => {
        logger.info('WebSocket server closed.');
    });
    server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        logger.error('Could not close connections in time, forcing shutdown.');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err, origin) => {
    logger.error(`UNCAUGHT EXCEPTION. Origin: ${origin}`, err.stack || err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

logger.info('Server setup complete. Listening for connections...');