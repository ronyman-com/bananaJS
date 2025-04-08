const express = require('express');
    const path = require('path');
    const fs = require('fs-extra');
    // const open = require('open'); // Commented out - unreliable in some environments
    const WebSocket = require('ws');
    const chokidar = require('chokidar');
    const http = require('http');
    const os = require('os'); // For network IP

    // --- Logging Setup ---
    // Simple console logger with prefixes
    const logInfo = (...args) => console.log('[INFO]', ...args);
    const logWarn = (...args) => console.warn('[WARN]', ...args);
    const logError = (...args) => console.error('[ERROR]', ...args);
    const logDebug = (...args) => {
        // Only log debug messages if NODE_ENV is development
        if (process.env.NODE_ENV === 'development') {
            console.log('[DEBUG]', ...args);
        }
    };
    // --- End Logging Setup ---

    logInfo('Server script starting...');
    logDebug(`Node.js Version: ${process.version}`);
    logDebug(`Initial CWD: ${process.cwd()}`);
    logDebug(`NODE_ENV: ${process.env.NODE_ENV}`);

    // --- Configuration from Environment Variables (Passed by CLI) ---
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || 'localhost'; // Get host from env
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const OPEN_BROWSER = process.env.OPEN_BROWSER === 'true';

    // --- Directory Configuration ---
    // PRIORITIZE environment variables set by the CLI
    let projectRoot = process.env.PROJECT_ROOT;
    let publicDir = process.env.PUBLIC_DIR;
    let srcDir = process.env.SRC_DIR;

    logDebug('Raw environment variables received:');
    logDebug(`  process.env.PROJECT_ROOT: ${process.env.PROJECT_ROOT}`);
    logDebug(`  process.env.PUBLIC_DIR: ${process.env.PUBLIC_DIR}`);
    logDebug(`  process.env.SRC_DIR: ${process.env.SRC_DIR}`);

    // Fallback logic if environment variables are NOT set (e.g., running server.cjs directly)
    if (!projectRoot) {
        logWarn('PROJECT_ROOT environment variable not set. Detecting fallback...');
        // Simplified root detection for direct execution
        projectRoot = process.cwd(); // Default to CWD if run directly
        logInfo(`Fallback projectRoot detected: ${projectRoot}`);
    }
    if (!publicDir) {
        logWarn('PUBLIC_DIR environment variable not set. Calculating fallback...');
        publicDir = path.join(projectRoot, (NODE_ENV === 'production' ? 'dist' : 'public'));
        logInfo(`Fallback publicDir calculated: ${publicDir}`);
        // In production fallback, check public if dist doesn't exist
        if (NODE_ENV === 'production' && !fs.existsSync(publicDir)) {
            const fallbackPublic = path.join(projectRoot, 'public');
            if (fs.existsSync(fallbackPublic)) {
                logInfo(`Production 'dist' not found, falling back to 'public': ${fallbackPublic}`);
                publicDir = fallbackPublic;
            }
        }
    }
    if (!srcDir && NODE_ENV === 'development') { // Only calculate srcDir fallback in dev
        logWarn('SRC_DIR environment variable not set. Calculating fallback...');
        srcDir = path.join(projectRoot, 'src');
        logInfo(`Fallback srcDir calculated: ${srcDir}`);
    }

    // --- Final Directory Verification ---
    logInfo('Final Directory Configuration:');
    logInfo(`- Project Root: ${projectRoot}`);
    logInfo(`- Public Directory: ${publicDir}`);
    if (NODE_ENV === 'development') {
        logInfo(`- Source Directory: ${srcDir || 'N/A'}`); // Show N/A if not applicable/found
    }

    // CRITICAL CHECK: Ensure the final publicDir exists
    if (!publicDir || !fs.existsSync(publicDir)) {
        logError(`❌ FATAL: Public directory does not exist or is inaccessible.`);
        logError(`   Path checked: ${publicDir || 'Not Defined'}`);
        logError(`   Please ensure this directory exists and the server has permissions to read it.`);
        logError(`   This path was determined from environment variables or calculated fallback.`);
        process.exit(1); // Exit if the essential public directory isn't found
    } else {
        logInfo(`✅ Public directory verified: ${publicDir}`);
    }

    // Check srcDir existence only if defined and in development
    const srcDirExists = NODE_ENV === 'development' && srcDir && fs.existsSync(srcDir);
    if (NODE_ENV === 'development') {
        if (srcDirExists) {
            logInfo(`✅ Source directory verified: ${srcDir}`);
        } else {
            logWarn(`⚠️ Source directory not found or not applicable: ${srcDir || 'Not Defined'}`);
            logWarn(`   HMR for source files will be disabled.`);
        }
    }
    // --- End Directory Configuration ---


    // --- Placeholder for createApp ---
    let createApp;
    const createAppPath = path.resolve(projectRoot, './lib/create-app.cjs'); // Resolve from project root
    if (fs.existsSync(createAppPath)) {
      try {
        createApp = require(createAppPath);
        logDebug(`Loaded createApp module from: ${createAppPath}`);
      } catch (err) {
        logError(`Error loading createApp module from ${createAppPath}:`, err);
        createApp = async () => { throw new Error('createApp module failed to load'); };
      }
    } else {
      logWarn(`createApp module not found at ${createAppPath}. API endpoint /api/create-app will not work.`);
      createApp = async () => { throw new Error('createApp module not found'); };
    }
    // --- End Placeholder for createApp ---


    // Initialize Express and HTTP server
    const app = express();
    app.use(express.json()); // Middleware to parse JSON request bodies
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    // Performance tracking
    let buildStartTime; // For HMR timing
    let hmrUpdateTime;

    // Middleware
    app.use((req, res, next) => {
      logDebug(`Request: ${req.method} ${req.originalUrl}`);
      next();
    });

    // Static file serving configuration
    const staticOptions = {
      index: false, // We handle index.html fallback manually
      redirect: false,
      dotfiles: 'ignore',
      maxAge: NODE_ENV === 'production' ? '1y' : '0',
      fallthrough: true // Allow falling through to other routes if file not found
    };

    // Serve static files from publicDir (verified to exist)
    logInfo(`Setting up static file serving from: ${publicDir}`);
    app.use(express.static(publicDir, staticOptions));

    // Serve source files in development from srcDir (if it exists)
    if (NODE_ENV === 'development' && srcDirExists) {
      logInfo(`Setting up static file serving for /src from: ${srcDir}`);
      app.use('/src', express.static(srcDir, staticOptions));
    }

    // --- API Endpoints ---
    // Example: Get server status
    app.get('/api/status', (req, res) => {
        res.json({
            status: 'running',
            nodeEnv: NODE_ENV,
            projectRoot: path.relative(process.cwd(), projectRoot), // Show relative path
            servingPublic: path.relative(process.cwd(), publicDir),
            servingSrc: NODE_ENV === 'development' && srcDirExists ? path.relative(process.cwd(), srcDir) : null,
            uptime: process.uptime()
        });
    });

    // Add other API endpoints (/api/files, /api/create-project, /api/create-app) here
    // Ensure they use the verified 'projectRoot', 'publicDir', 'srcDir' variables
    app.get('/api/files', (req, res) => {
      logDebug(`GET /api/files received. Query:`, req.query);
      const { directory } = req.query;
      // Resolve relative to the *projectRoot* determined by the server
      const baseDir = path.resolve(projectRoot, directory || '');
      logDebug(`/api/files: Resolved base directory: ${baseDir}`);

      // Security check: Prevent traversing outside project root
      if (!baseDir.startsWith(projectRoot)) {
          logWarn(`/api/files: Attempt to access directory outside project root: ${baseDir}`);
          return res.status(400).json({ success: false, message: 'Invalid directory path.' });
      }

      if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
        logWarn(`/api/files: Directory not found or not a directory: ${baseDir}`);
        return res.status(404).json({ success: false, message: `Directory "${path.relative(projectRoot, baseDir)}" does not exist or is not a directory.` });
      }

      try {
        logDebug(`/api/files: Reading directory: ${baseDir}`);
        const files = [];
        const items = fs.readdirSync(baseDir);
        items.forEach(item => {
          const fullPath = path.join(baseDir, item);
          try {
              const stat = fs.statSync(fullPath);
              files.push({
                name: item,
                // Send path relative to project root, normalized
                path: path.relative(projectRoot, fullPath).replace(/\\/g, '/'),
                isDirectory: stat.isDirectory()
              });
          } catch (statErr) {
              logError(`/api/files: Error stating file ${fullPath}:`, statErr.code || statErr.message);
          }
        });
        logDebug(`/api/files: Sending ${files.length} items.`);
        res.json({ success: true, files });
      } catch (readErr) {
          logError(`/api/files: Error reading directory ${baseDir}:`, readErr);
          res.status(500).json({ success: false, message: 'Error reading directory contents.' });
      }
    });

    app.post('/api/create-project', (req, res) => {
       logDebug(`POST /api/create-project received. Body:`, req.body);
      const { projectName } = req.body;
      if (!projectName || typeof projectName !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(projectName)) {
          logWarn(`/api/create-project: Invalid project name: ${projectName}`);
          return res.status(400).json({ success: false, message: 'Invalid project name (use letters, numbers, underscore, dot, hyphen).' });
      }

      // Create project relative to the server's projectRoot
      const projectDir = path.join(projectRoot, projectName);
      logDebug(`/api/create-project: Target project directory: ${projectDir}`);

      if (fs.existsSync(projectDir)) {
         logWarn(`/api/create-project: Project directory already exists: ${projectDir}`);
        return res.status(400).json({ success: false, message: `Project "${projectName}" already exists.` });
      }

      // Template directory should be relative to the *server script's location* or a known path
      const templateDir = path.resolve(__dirname, '..', 'templates', 'default'); // Adjust template path as needed
      logDebug(`/api/create-project: Using template directory: ${templateDir}`);

      if (!fs.existsSync(templateDir)) {
          logError(`/api/create-project: Template directory not found at ${templateDir}`);
          return res.status(500).json({ success: false, message: 'Default project template not found on server.' });
      }

      try {
          logDebug(`/api/create-project: Copying template from ${templateDir} to ${projectDir}`);
          fs.copySync(templateDir, projectDir);
          logDebug(`/api/create-project: Project created successfully: ${projectName}`);
          res.json({ success: true, message: `Project "${projectName}" created successfully!` });
      } catch (copyErr) {
          logError(`/api/create-project: Error copying template to ${projectDir}:`, copyErr);
          res.status(500).json({ success: false, message: 'Failed to create project from template.' });
      }
    });

    app.post('/api/create-app', async (req, res) => {
       logDebug(`POST /api/create-app received. Body:`, req.body);
      try {
        const { appName, template } = req.body;
         if (!appName || !template) {
             logWarn(`/api/create-app: Missing appName or template.`);
            return res.status(400).json({ success: false, message: 'Missing appName or template in request body.' });
        }
        if (typeof createApp !== 'function') {
             logError(`/api/create-app: createApp module is not available or not a function.`);
             throw new Error('createApp module is not available.');
        }
        logDebug(`/api/create-app: Calling createApp with name "${appName}" and template "${template}"`);
        // Assuming createApp creates the app relative to the projectRoot
        const result = await createApp(appName, template);
        if (!result || typeof result.appDir !== 'string') {
            logError(`/api/create-app: createApp did not return expected object with appDir string. Received:`, result);
            throw new Error('Invalid response from createApp module.');
        }
        const { appDir } = result;
        logDebug(`/api/create-app: createApp returned appDir: ${appDir}`);

        // Return path relative to project root
        const relativeAppDir = path.relative(projectRoot, appDir).replace(/\\/g, '/');
        logDebug(`/api/create-app: App created successfully at relative path: ${relativeAppDir}`);
        res.json({ success: true, message: `Created ${template} app "${appName}" at ${relativeAppDir}`, path: relativeAppDir });
      } catch (err) {
         logError("Error in /api/create-app:", err);
         res.status(500).json({ success: false, message: err.message || 'Failed to create app.' });
      }
    });
    // --- End API Endpoints ---


    // --- WebSocket and HMR (Development Only) ---
    if (NODE_ENV === 'development') {
      logInfo('Development mode: Setting up WebSocket and HMR...');
      const watchPaths = [];
      // Use the already verified publicDir path
      watchPaths.push(publicDir);
      logDebug(`HMR: Watching public directory: ${publicDir}`);

      // Watch srcDir only if it was verified to exist
      if (srcDirExists) {
          watchPaths.push(srcDir);
          logDebug(`HMR: Watching source directory: ${srcDir}`);
      }

      const watcher = chokidar.watch(watchPaths, {
        ignored: /(^|[\/\\])\..*|node_modules|dist/, // Ignore dotfiles/dirs, node_modules, dist
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 100 }
      });
      logDebug(`HMR: Chokidar watcher initialized for paths: ${watchPaths.join(', ')}`);

      let hmrTimeout;
      const sendUpdate = (filePath) => {
          buildStartTime = buildStartTime || Date.now(); // Ensure buildStartTime is set
          hmrUpdateTime = Date.now() - buildStartTime;
          const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
          logInfo(`HMR: File changed: ${relativePath}, sending update...`);
          const message = JSON.stringify({ type: 'update', file: relativePath, time: hmrUpdateTime });
          let clientCount = 0;
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
              clientCount++;
            }
          });
          logDebug(`HMR: Update sent to ${clientCount} clients.`);
          buildStartTime = Date.now(); // Reset start time after update
      };

      watcher
        .on('add', filePath => { logDebug(`HMR Event: File added - ${filePath}`); clearTimeout(hmrTimeout); hmrTimeout = setTimeout(() => sendUpdate(filePath), 75); })
        .on('change', filePath => { logDebug(`HMR Event: File changed - ${filePath}`); clearTimeout(hmrTimeout); hmrTimeout = setTimeout(() => sendUpdate(filePath), 75); })
        .on('unlink', filePath => { logDebug(`HMR Event: File removed - ${filePath}`); clearTimeout(hmrTimeout); hmrTimeout = setTimeout(() => sendUpdate(filePath), 75); })
        .on('error', error => logError(`HMR Watcher Error: ${error}`))
        .on('ready', () => logDebug('HMR Watcher: Initial scan complete. Ready for changes.'));

    } else {
      logInfo('Production mode: HMR disabled.');
    }
    // --- End WebSocket and HMR ---


    // --- Special Routes (Example: Dashboard) ---
    // Ensure dashboard.html exists in publicDir if you use this
    app.get('/dashboard', (req, res, next) => {
      const dashboardPath = path.join(publicDir, 'dashboard.html');
      logDebug(`GET /dashboard: Checking for ${dashboardPath}`);
       if (fs.existsSync(dashboardPath)) {
           logDebug(`GET /dashboard: Sending file ${dashboardPath}`);
           res.sendFile(dashboardPath);
       } else {
           logDebug(`GET /dashboard: dashboard.html not found. Falling through.`);
           next(); // Fall through to SPA handler or 404
       }
    });
    // --- End Special Routes ---


    // --- SPA Fallback Route (Must be Last Route) ---
    app.get('*', (req, res) => {
      logDebug(`SPA Fallback: Handling request for ${req.path}`);
      // Avoid SPA fallback for likely static asset requests that weren't caught
      if (req.path.includes('.') && !req.path.endsWith('.html')) {
          logDebug(`SPA Fallback: Request looks like a non-HTML file (${req.path}), sending 404.`);
          res.status(404).type('text/plain').send('Not Found');
          return;
      }

      // Serve index.html from the verified publicDir
      const indexPath = path.join(publicDir, 'index.html');
      logDebug(`SPA Fallback: Checking for index.html at ${indexPath}`);
      if (fs.existsSync(indexPath)) {
          logDebug(`SPA Fallback: Sending index.html`);
          res.sendFile(indexPath);
      } else {
          logError(`SPA Fallback: index.html not found at ${indexPath}. Sending 404 page.`);
          res.status(404).type('text/html').send(`
              <h1>404 - Not Found</h1>
              <p>The requested path "${req.path}" could not be handled.</p>
              <p>The main application file (index.html) is missing from the public directory (${publicDir}).</p>
          `);
      }
    });
    // --- End SPA Fallback Route ---


    // --- WebSocket Connection Handling ---
    wss.on('connection', (ws, req) => {
      // const clientIp = req.socket.remoteAddress; // Get client IP if needed
      logInfo(`WebSocket Client connected.`);
      ws.on('message', (message) => {
          logDebug(`WebSocket received: ${message.toString()}`);
          // Optional: Echo back or handle client messages
          // ws.send(`Server received: ${message}`);
      });
      ws.on('close', (code, reason) => logInfo(`WebSocket Client disconnected. Code: ${code}, Reason: ${reason ? reason.toString() : 'N/A'}`));
      ws.on('error', (err) => logError('WebSocket connection error:', err));
    });

    wss.on('error', (error) => {
        logError('WebSocket Server Error:', error); // Errors on the server itself
    });
    // --- End WebSocket Handling ---


    // --- Error Handling Middleware (Last app.use) ---
    app.use((err, req, res, next) => {
      logError("Unhandled Express error:", err.stack || err);
      const statusCode = err.status || 500;
      const message = NODE_ENV === 'production' ? 'Internal Server Error' : `Server Error: ${err.message}`;
      res.status(statusCode).type('text/plain').send(message);
    });
    // --- End Error Handling Middleware ---


    // --- Start Server ---
    server.listen(PORT, HOST, () => { // Listen on specified HOST
      const serverUrl = `http://${HOST}:${PORT}`;
      const networkUrl = HOST === '0.0.0.0' ? `http://${getLocalIpAddress()}:${PORT}` : null;

      console.log(`\n✅ BananaJS Server Started Successfully:`);
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

      // Browser opening logic (use with caution in containers)
      if (OPEN_BROWSER && NODE_ENV === 'development') {
          logInfo(`Attempting to open browser at ${serverUrl}...`);
          // Dynamically import 'open' only when needed
          import('open').then(({ default: open }) => {
              open(serverUrl).catch(err => logError("Failed to open browser:", err));
          }).catch(err => logError("Failed to dynamically import 'open' package:", err));
      }

    }).on('error', (error) => {
        logError(`Server failed to start on ${HOST}:${PORT}:`, error);
        if (error.syscall !== 'listen') { throw error; }
        switch (error.code) {
            case 'EACCES':
                console.error(errorStyle(`❌ Error: Port ${PORT} requires elevated privileges or is blocked.`));
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(errorStyle(`❌ Error: Port ${PORT} on host ${HOST} is already in use.`));
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
    // --- End Start Server ---


    // --- Graceful Shutdown Handling ---
    const shutdown = (signal) => {
        logWarn(`Received ${signal}. Shutting down gracefully...`);
        // Close WebSocket connections
        wss.close(() => {
            logInfo('WebSocket server closed.');
        });
        // Stop accepting new HTTP connections and close existing ones
        server.close(() => {
            logInfo('HTTP server closed.');
            process.exit(0); // Exit cleanly
        });
        // Force shutdown if graceful close takes too long
        setTimeout(() => {
            logError('Could not close connections in time, forcing shutdown.');
            process.exit(1);
        }, 10000); // 10 seconds timeout
    };

    process.on('SIGINT', () => shutdown('SIGINT')); // CTRL+C
    process.on('SIGTERM', () => shutdown('SIGTERM')); // kill command

    process.on('uncaughtException', (err, origin) => {
        logError(`UNCAUGHT EXCEPTION. Origin: ${origin}`, err.stack || err);
        process.exit(1); // Mandatory exit after uncaught exception
    });

    process.on('unhandledRejection', (reason, promise) => {
        logError('UNHANDLED REJECTION at:', promise, 'reason:', reason);
        // Optional: exit based on severity, but often better to log and continue
        // process.exit(1);
    });
    // --- End Graceful Shutdown ---

    logInfo('Server setup complete. Listening for connections...');
