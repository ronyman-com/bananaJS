const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const { exec } = require('child_process');
const { createApp, createProject } = require('../lib/shared/create-utils.cjs');
const { spawn } = require('node-pty');
const os = require('os');


// In your server.js, modify the WebSocket server section:
//const wss = new WebSocket.Server({ server });
// Serve static files from lib directory
app.use('/lib', express.static(path.join(__dirname, '../lib')));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Handle .html extension and clean URLs
app.use((req, res, next) => {
  if (!path.extname(req.path)) {
    const filePath = path.join(__dirname, '../public', `${req.path}.html`);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) next();
      else res.sendFile(filePath);
    });
  } else {
    next();
  }
});

// API routes
app.get('/api/files', (req, res) => {
  const directory = req.query.directory || 'workspace';
  const fullPath = path.join(__dirname, '../', directory);
  
  try {
    const files = fs.readdirSync(fullPath).map(file => {
      const stats = fs.statSync(path.join(fullPath, file));
      return {
        name: file,
        isDirectory: stats.isDirectory(),
        path: path.join(directory, file)
      };
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CLI Execution Endpoint
app.post('/api/execute-cli', (req, res) => {
  const { command, args } = req.body;
  
  if (!command || !args) {
    return res.status(400).json({ error: 'Missing command or arguments' });
  }

  // Construct the CLI command
  let cmd = `node ${path.join(__dirname, '../bin/cli.cjs')} ${command} ${args.name}`;
  if (args.gitInit) cmd += ' --git-init';
  if (args.useYarn) cmd += ' --use-yarn';

  // Set up streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.status(200);

  // Execute the command
  const child = exec(cmd, { cwd: path.join(__dirname, '..') });

  // Stream output to client
  child.stdout.on('data', (data) => res.write(data));
  child.stderr.on('data', (data) => res.write(data));

  child.on('close', (code) => {
    if (code !== 0) {
      res.write(`\nProcess exited with code ${code}`);
    }
    res.end();
  });
});


// Ensure workspace directory exists
async function ensureWorkspace() {
  const workspacePath = path.join(process.cwd(), 'workspace');
  try {
    await fs.mkdir(workspacePath, { recursive: true });
    return workspacePath;
  } catch (error) {
    throw new Error(`Failed to create workspace directory: ${error.message}`);
  }
}

// Create App Endpoint
app.post('/api/create/app', async (req, res) => {
  try {
    const { name, template } = req.body;
    
    if (!name || !template) {
      return res.status(400).json({
        success: false,
        message: 'Both name and template are required'
      });
    }

    const workspacePath = await ensureWorkspace();
    const result = await createApp(name, template, { parentPath: workspacePath });

    res.json({
      success: true,
      ...result,
      workspacePath: path.relative(process.cwd(), workspacePath)
    });
  } catch (error) {
    console.error('App creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code // Include system error code if available
    });
  }
});

// Create Project Endpoint
app.post('/api/create/project', async (req, res) => {
  try {
    const { name, template, packageManager = 'npm', initGit = false } = req.body;
    
    if (!name || !template) {
      return res.status(400).json({
        success: false,
        message: 'Both name and template are required'
      });
    }

    const workspacePath = await ensureWorkspace();
    const result = await createProject(name, template, { 
      parentPath: workspacePath,
      packageManager,
      initGit
    });

    res.json({
      success: true,
      ...result,
      workspacePath: path.relative(process.cwd(), workspacePath)
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
});

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// Add this near your WebSocket server setup
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Create PTY process for terminal
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env
  });

  // Handle terminal data
  ptyProcess.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'terminal-output',
      data: data
    }));
  });

  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.type === 'terminal-input') {
        ptyProcess.write(parsed.data);
      }
      else if (parsed.type === 'terminal-resize') {
        ptyProcess.resize(parsed.cols, parsed.rows);
      }
      else if (parsed.type === 'terminal-command') {
        ptyProcess.write(parsed.command + '\r');
      }
      
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    ptyProcess.kill();
  });
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  // Verify auth token
  const token = req.headers['sec-websocket-protocol'];
  if (!verifyToken(token)) {
    return ws.close(1008, 'Unauthorized');
  }
  // Send initial build metrics
  const initialMetrics = {
    type: 'metrics',
    data: {
      memory: process.memoryUsage().rss,
      cpu: 0,
      buildTime: 0,
      hmrUpdateTime: 0
    }
  };
  ws.send(JSON.stringify(initialMetrics));

  // Handle client messages
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'request-metrics') {
        ws.send(JSON.stringify(initialMetrics));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  

  // Simulate HMR updates for demo purposes
  const hmrInterval = setInterval(() => {
    const update = {
      type: 'update',
      file: `src/components/${['Navbar','Sidebar','Footer'][Math.floor(Math.random()*3)]}.jsx`,
      time: Math.floor(Math.random() * 100) + 50
    };
    ws.send(JSON.stringify(update));
  }, 5000);

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    clearInterval(hmrInterval);
  });
});


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
      const msg = JSON.parse(message);
      
      if (msg.type === 'command') {
        ptyProcess.write(msg.command + '\r');
      }
      else if (msg.type === 'resize') {
        ptyProcess.resize(msg.cols, msg.rows);
      }
    } catch (e) {
      console.error('Error handling terminal message:', e);
    }
  });

  ws.on('close', () => {
    ptyProcess.kill();
  });
});
// In your API route file (e.g., routes/projects.js)
router.post('/create-project', async (req, res) => {
  try {
    // Debugging: Log exactly what's received
    console.log('API Received:', {
      body: req.body,
      headers: req.headers
    });

    // Mimic CLI argument handling
    const { name, git = false, packageManager = 'npm' } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Invalid project name',
        received: req.body // Show what actually came through
      });
    }

    // IMPORTANT: Use the same creation logic as your CLI
    const { createProject } = require('../../bin/lib/create-project');
    const result = await createProject(name, { git, packageManager });

    res.json({ success: true, ...result });

  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});




// Track terminal processes
const terminalProcesses = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Generate unique ID for this connection
  const connectionId = uuidv4();
  
  // Handle terminal messages
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.type === 'terminal-command') {
        handleTerminalCommand(ws, connectionId, parsed.command);
      }
      else if (parsed.type === 'terminal-input') {
        handleTerminalInput(connectionId, parsed.data);
      }
      else if (parsed.type === 'terminal-resize') {
        handleTerminalResize(connectionId, parsed.cols, parsed.rows);
      }
      
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    // Clean up terminal process
    if (terminalProcesses.has(connectionId)) {
      terminalProcesses.get(connectionId).kill();
      terminalProcesses.delete(connectionId);
    }
  });
});

function handleTerminalCommand(ws, connectionId, command) {
  // Create PTY process if it doesn't exist
  if (!terminalProcesses.has(connectionId)) {
    const ptyProcess = spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
      cwd: process.cwd(),
      env: process.env
    });
    
    terminalProcesses.set(connectionId, ptyProcess);
    
    ptyProcess.on('data', (data) => {
      ws.send(JSON.stringify({
        type: 'terminal-output',
        data: data.toString()
      }));
    });
    
    ptyProcess.on('exit', () => {
      terminalProcesses.delete(connectionId);
    });
  }
  
  // Send command to process
  terminalProcesses.get(connectionId).write(command + '\n');
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

function handleTerminalCommand(ws, connectionId, command) {
  // Validate command
  if (command.trim() === 'rm -rf /') {
    return ws.send(JSON.stringify({
      type: 'terminal-output',
      data: '\r\nDangerous command blocked!\r\n'
    }));
  }



// Watch for file changes (for HMR simulation)
if (process.env.NODE_ENV === 'development') {
  const chokidar = require('chokidar');
  const watcher = chokidar.watch([
    path.join(__dirname, '../src/**/*.js'),
    path.join(__dirname, '../src/**/*.jsx'),
    path.join(__dirname, '../public/**/*.html')
  ], { ignored: /node_modules/ });

  watcher.on('change', (filePath) => {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`File changed: ${relativePath}`);
    
    // Notify all connected WebSocket clients
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