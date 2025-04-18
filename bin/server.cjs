const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const http = require('http');
const os = require('os');
const history = require('connect-history-api-fallback');
const createWebSocketServer = require('./websocket.cjs');

const app = express();
const port = process.env.PORT || 5000;
const host = process.env.HOST || 'localhost';
const publicDir = process.env.PUBLIC_DIR || path.join(process.cwd(), 'public');
const shouldOpen = process.env.OPEN_BROWSER === 'true';

// Create HTTP server
const server = http.createServer(app);

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
app.use(express.json());
app.use((req, res, next) => {
    // Set proper CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });



// Performance tracking
let buildStartTime;
let hmrUpdateTime;

// --- Middleware ---
app.use((req, res, next) => {
    buildStartTime = Date.now();
    logger.debug(`Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware to handle SPA fallback
app.use(history({
    rewrites: [
        {
            from: /^\/api\/.*$/,
            to: function(context) {
                return context.parsedUrl.pathname;
            }
        },
        {
            // Don't rewrite files with extensions
            from: /\/[^/]+\.[^/]+$/,
            to: function(context) {
                return context.parsedUrl.pathname;
            }
        }
    ]
}));

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



// Custom middleware to handle static files and API routes
app.use((req, res, next) => {
    const filePath = path.join(publicDir, req.path);

// Check if it's an API route
if (req.path.startsWith('/api/')) {
    return next(); // Let API routes pass through
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      // Serve the existing file directly
      express.static(publicDir)(req, res, next);
    } else {
      // Forward to SPA handler
      next();
    }
  });
});




// Add this right after your logger configuration
const mime = require('mime-types');
express.static.mime.define({
  'application/javascript': ['jsx'],
  'text/jsx': ['jsx'] // Fallback
});

// Add this middleware before your static file serving
app.use((req, res, next) => {
  if (req.url.endsWith('.jsx')) {
    res.set('Content-Type', 'application/javascript');
  }
  next();
});


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

// In your server routes
app.get('/api/files', async (req, res) => {
    try {
      const { directory = '' } = req.query;
      const fullPath = path.join(process.cwd(), '/workspace', directory);
      
      // Verify the path is within allowed directory
      if (!fullPath.startsWith(path.join(process.cwd(), ''))) {
        return res.status(400).json({ error: 'Access denied' });
      }
  
      // Read directory contents
      const items = await fs.readdir(fullPath);
      const files = await Promise.all(items.map(async (item) => {
        const itemPath = path.join(fullPath, item);
        const stats = await fs.stat(itemPath);
        
        return {
          name: item,
          path: path.relative(path.join(process.cwd(), '/workspace'), itemPath),
          isDirectory: stats.isDirectory(),
          size: stats.isFile() ? stats.size : 0,
          modified: stats.mtime
        };
      }));
  
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

const createProject = require('../lib/create-project.cjs');

app.post('/api/create-project', express.json(), async (req, res) => {
    try {
      const { 
        name: projectName, 
        git = false, 
        packageManager = 'npm' 
      } = req.body;
  
      // Define workspace directory
      const workspaceDir = path.join(process.cwd(), 'workspace');
      
      // Ensure workspace directory exists
      await fs.mkdir(workspaceDir, { recursive: true });
  
      // Call createProject with the workspace directory as base
      const result = await createProject(projectName, {
        git,
        packageManager,
        parentPath: workspaceDir // Assuming createProject accepts this option
      });
  
      res.json({
        success: true,
        projectDir: path.relative(process.cwd(), result.projectDir),
        projectName: result.projectName,
        packageManager: result.packageManager
      });
  
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          receivedBody: req.body
        })
      });
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
        
        // Define workspace directory
        const workspaceDir = path.join(process.cwd(), 'workspace');
        await fs.mkdir(workspaceDir, { recursive: true });
        
        logger.debug(`/api/create-app: Calling createApp with name "${appName}" and template "${template}"`);
        const result = await createApp(appName, template, {
            parentPath: workspaceDir // Assuming createApp accepts this option
        });
        
        if (!result || typeof result.appDir !== 'string') {
            logger.error(`/api/create-app: createApp did not return expected object with appDir string. Received:`, result);
            throw new Error('Invalid response from createApp module.');
        }
        
        const { appDir } = result;
        logger.debug(`/api/create-app: createApp returned appDir: ${appDir}`);
        const relativeAppDir = path.relative(process.cwd(), appDir).replace(/\\/g, '/workspace');
        
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



app.post('/api/create-file', async (req, res) => {
    try {
      const { path: filePath, name, template = 'empty', content = '' } = req.body;
      const fullPath = path.join(process.cwd(), filePath, name);
      const result = await createFile(fullPath, { template, content });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  app.post('/api/create-folder', async (req, res) => {
    try {
      const { path: folderPath, name } = req.body;
      const fullPath = path.join(process.cwd(), folderPath, name);
      const result = await createFolder(fullPath);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  



// --- WebSocket and HMR ---
const wss = new WebSocket.Server({ server });

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

// Fixed SPA Fallback Route
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

//----

const { spawn } = require('node-pty');

// Add to your WebSocket server setup
wss.on('connection', (ws) => {
  console.log('New terminal connection');
  
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env
  });

  // Handle terminal data
  ptyProcess.on('data', (data) => {
    try {
      ws.send(data);
    } catch (e) {
      // Client disconnected
    }
  });

  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : message;
      
      if (msg.type === 'resize') {
        ptyProcess.resize(msg.cols, msg.rows);
      } else {
        ptyProcess.write(message.toString());
      }
    } catch (e) {
      console.error('Error handling terminal message:', e);
    }
  });

  ws.on('close', () => {
    ptyProcess.kill();
  });
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