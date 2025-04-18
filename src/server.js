const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { createApp, createProject } = require('../lib/shared/create-utils.cjs');
const { spawn } = require('node-pty');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const WORKSPACE_PATH = path.join(__dirname, '../workspace');
const MAX_WS_RECONNECT_ATTEMPTS = 5;
const WS_RECONNECT_DELAY = 1000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/lib', express.static(path.join(__dirname, '../lib')));

// Handle .html extension and clean URLs
app.use((req, res, next) => {
  if (!path.extname(req.path)) {
    const filePath = path.join(__dirname, '../public', `${req.path}.html`);
    fs.access(filePath)
      .then(() => res.sendFile(filePath))
      .catch(() => next());
  } else {
    next();
  }
});

// API routes
app.get('/api/files', async (req, res) => {
  const directory = req.query.directory || '';
  const fullPath = path.join(WORKSPACE_PATH, directory);
  
  try {
    const files = await fs.readdir(fullPath);
    const fileStats = await Promise.all(
      files.map(async file => {
        const stats = await fs.stat(path.join(fullPath, file));
        return {
          name: file,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          path: path.join(directory, file).replace(/\\/g, '/')
        };
      })
    );
    res.json(fileStats);
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: error.message });
  }
});


    // --- API Route: POST /api/create-file ---
    // Handles requests from the browser's createNewFile() function.
    // Expects JSON body: { path: string, name: string, template?: string, content?: string }
    app.post('/api/create-file', async (req, res) => {
      try {
        // Extract data sent from the browser
        const { path: targetDir, name: fileName, template, content } = req.body;

        if (!targetDir || !fileName) {
          return res.status(400).json({ success: false, error: 'Missing path or name in request body' });
        }

        // Calculate the full absolute path where the file should be created
        const absoluteTargetDir = getAbsolutePath(targetDir);
        const absoluteFilePath = path.join(absoluteTargetDir, fileName);

        // Call your createFile function with the calculated absolute path and options
        const result = await createFile(absoluteFilePath, { template, content });

        // Send a success response back to the browser
        res.json({ success: true, message: 'File created', path: targetDir, name: fileName, result });

      } catch (error) {
        console.error('Server Error creating file:', error);
        // Send an error response back to the browser
        res.status(500).json({ success: false, error: error.message || 'Failed to create file' });
      }
    });

    // --- API Route: POST /api/create-folder ---
    // Handles requests from the browser's createNewFolder() function.
    // Expects JSON body: { path: string, name: string }
    app.post('/api/create-folder', async (req, res) => {
      try {
        // Extract data sent from the browser
        const { path: targetDir, name: folderName } = req.body;

        if (!targetDir || !folderName) {
          return res.status(400).json({ success: false, error: 'Missing path or name in request body' });
        }

        // Calculate the full absolute path where the folder should be created
        const absoluteTargetDir = getAbsolutePath(targetDir);
        const absoluteFolderPath = path.join(absoluteTargetDir, folderName);

        // Call your createFolder function with the calculated absolute path
        // Note: Your createFolder.cjs uses ensureDir, which handles recursion by default.
        const result = await createFolder(absoluteFolderPath);

        // Send a success response back to the browser
        res.json({ success: true, message: 'Folder created', path: targetDir, name: folderName, result });

      } catch (error) {
        console.error('Server Error creating folder:', error);
        // Send an error response back to the browser
        res.status(500).json({ success: false, error: error.message || 'Failed to create folder' });
      }
    });

    // --- API Route: POST /api/upload ---
    // Handles requests from the browser's startUpload() function.
    // Expects FormData with 'files' and 'directory'.
    // Use the multer middleware from upload.cjs to handle the incoming files.
    app.post('/api/upload', uploadModule.handleUpload, async (req, res) => {
       // After uploadModule.handleUpload runs, req.files will contain file info
       // and req.body will contain other form fields like 'directory'.
       try {
           // Call the processUpload function from upload.cjs
           // This function is designed to use req.files and req.body.directory
           await uploadModule.processUpload(req, res);
           // Note: processUpload sends the response itself, so no need for res.json() here
       } catch (error) {
           console.error('Server Error processing upload:', error);
           // If processUpload didn't already send a response, send one now
           if (!res.headersSent) {
               res.status(500).json({ success: false, error: error.message || 'Failed to process upload' });
           }
       }
    });

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  ensureWorkspace().catch(err => console.error('Workspace init error:', err));
});

// WebSocket Server Setup
const wss = new WebSocket.Server({ server, clientTracking: true });
const terminalProcesses = new Map();

// Enhanced WebSocket connection handler
wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  console.log(`New WebSocket connection: ${connectionId}`);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('pong', () => {
    console.log(`Received pong from ${connectionId}`);
  });

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message);
      
      switch (parsed.type) {
        case 'terminal-command':
          handleTerminalCommand(ws, connectionId, parsed.command);
          break;
        case 'terminal-input':
          handleTerminalInput(connectionId, parsed.data);
          break;
        case 'terminal-resize':
          handleTerminalResize(connectionId, parsed.cols, parsed.rows);
          break;
        case 'request-metrics':
          sendInitialMetrics(ws);
          break;
        case 'build-command':
          handleBuildCommand(ws, parsed.command);
          break;
        case 'restart-command':
          handleRestartCommand(ws);
          break;
        default:
          console.warn('Unknown message type:', parsed.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket disconnected: ${connectionId}`);
    clearInterval(heartbeatInterval);
    cleanupTerminalProcess(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error (${connectionId}):`, error);
    clearInterval(heartbeatInterval);
    cleanupTerminalProcess(connectionId);
  });

  // Send initial metrics
  sendInitialMetrics(ws);
});

// Helper functions
async function ensureWorkspace() {
  try {
    await fs.mkdir(WORKSPACE_PATH, { recursive: true });
    console.log(`Workspace directory ready at ${WORKSPACE_PATH}`);
  } catch (error) {
    throw new Error(`Failed to create workspace: ${error.message}`);
  }
}

function sendInitialMetrics(ws) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'metrics',
      data: getSystemMetrics()
    }));
  }
}

function getSystemMetrics() {
  return {
    memory: process.memoryUsage().rss,
    cpu: os.loadavg()[0],
    buildTime: 0,
    hmrUpdateTime: 0,
    uptime: process.uptime()
  };
}

function handleTerminalCommand(ws, connectionId, command) {
  // Validate dangerous commands
  const dangerousPatterns = [
    /rm\s+-rf/, /\bdd\b/, /\:\(\)\{\s*\:\|\:\s*\&\s*\}/
  ];
  
  if (dangerousPatterns.some(pattern => command.match(pattern))) {
    return ws.send(JSON.stringify({
      type: 'terminal-output',
      data: '\r\nDangerous command blocked!\r\n'
    }));
  }

  if (!terminalProcesses.has(connectionId)) {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: WORKSPACE_PATH,
      env: process.env
    });
    
    terminalProcesses.set(connectionId, ptyProcess);
    
    ptyProcess.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'terminal-output',
          data: data
        }));
      }
    });
    
    ptyProcess.on('exit', () => {
      terminalProcesses.delete(connectionId);
    });
  }
  
  terminalProcesses.get(connectionId).write(command + '\r');
}

function handleTerminalInput(connectionId, data) {
  if (terminalProcesses.has(connectionId)) {
    terminalProcesses.get(connectionId).write(data);
  }
}

function handleTerminalResize(connectionId, cols, rows) {
  if (terminalProcesses.has(connectionId)) {
    terminalProcesses.get(connectionId).resize(cols, rows);
  }
}

function cleanupTerminalProcess(connectionId) {
  if (terminalProcesses.has(connectionId)) {
    const process = terminalProcesses.get(connectionId);
    try {
      process.kill();
    } catch (e) {
      console.error('Error killing terminal process:', e);
    }
    terminalProcesses.delete(connectionId);
  }
}

function handleBuildCommand(ws, command) {
  if (ws.readyState !== WebSocket.OPEN) return;

  const buildProcess = exec(command, { cwd: WORKSPACE_PATH });
  
  buildProcess.stdout.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'terminal-output',
      data: data
    }));
  });
  
  buildProcess.stderr.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'terminal-output',
      data: data
    }));
  });
  
  buildProcess.on('close', (code) => {
    ws.send(JSON.stringify({
      type: 'build-complete',
      time: Date.now(),
      code: code
    }));
  });
}

function handleRestartCommand(ws) {
  if (ws.readyState !== WebSocket.OPEN) return;

  ws.send(JSON.stringify({
    type: 'restart-notification',
    message: 'Server restarting...'
  }));

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// File watcher for development
if (process.env.NODE_ENV === 'development') {
  const watcher = chokidar.watch([
    path.join(__dirname, '../src/**/*'),
    path.join(__dirname, '../public/**/*')
  ], { 
    ignored: /node_modules/,
    ignoreInitial: true
  });

  watcher.on('change', (filePath) => {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`File changed: ${relativePath}`);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'file-change',
          file: relativePath
        }));
      }
    });
  });
}


// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (error.code === 'EPIPE') {
    console.log('EPIPE error occurred, continuing...');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1001, 'Server shutting down');
    }
  });
  
  // Close the WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close the HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
}