const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const { exec } = require('child_process');
const { createApp, createProject } = require('../lib/shared/create-utils.cjs');

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
  const directory = req.query.directory || '';
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

// Create App Endpoint
app.post('/api/create/app', async (req, res) => {
  try {
    const { name, template } = req.body;
    const result = await createApp(name, template);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create Project Endpoint
app.post('/api/create/project', async (req, res) => {
  try {
    const { name, template } = req.body;
    const result = await createProject(name, template);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
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