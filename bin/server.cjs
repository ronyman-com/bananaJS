const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const open = require('open');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const http = require('http');
const createApp = require(path.resolve(__dirname, '../lib/create-app.cjs'));

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = 5000;
const bananaRoot = path.join(__dirname, '..', '');
const publicDir = path.join(bananaRoot, 'public');
const srcDir = path.join(bananaRoot, 'src');

// Verify paths exist
if (!fs.existsSync(publicDir)) {
  console.error(`❌ Public directory not found at: ${publicDir}`);
  process.exit(1);
}

// Performance tracking
let buildStartTime;
let hmrUpdateTime;

// Middleware
app.use((req, res, next) => {
  buildStartTime = Date.now();
  next();
});

// Static file serving
app.use(express.static(publicDir));
app.use('/src', express.static(srcDir));
app.use(express.json());

// WebSocket and HMR setup
const watcher = chokidar.watch([publicDir, srcDir], {
  ignored: /node_modules/,
  persistent: true,
});

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

// File change handler for HMR
watcher.on('change', (filePath) => {
  hmrUpdateTime = Date.now() - buildStartTime;
  console.log(`HMR update took ${hmrUpdateTime}ms`);
  
  const relativePath = path.relative(process.cwd(), filePath);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ 
        type: 'update', 
        file: relativePath,
        time: hmrUpdateTime
      }));
    }
  });
});

// Routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// API Endpoints
app.get('/api/files', (req, res) => {
  const { directory } = req.query;
  const baseDir = path.join(process.cwd(), directory || '');
  const files = [];

  if (!fs.existsSync(baseDir)) {
    return res.status(404).json({ success: false, message: `Directory "${baseDir}" does not exist.` });
  }

  const traverse = (dir) => {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      files.push({
        name: item,
        path: fullPath,
        isDirectory: stat.isDirectory(),
      });
      if (stat.isDirectory()) {
        traverse(fullPath);
      }
    });
  };
  traverse(baseDir);
  res.json(files);
});

app.post('/api/create-project', (req, res) => {
  const { projectName } = req.body;
  const projectDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(projectDir)) {
    return res.status(400).json({ success: false, message: `Project "${projectName}" already exists.` });
  }

  const templateDir = path.join(__dirname, '/Projects');
  fs.copySync(templateDir, projectDir);
  res.json({ success: true, message: `Project "${projectName}" created successfully!` });
});

app.post('/api/create-app', async (req, res) => {
  try {
    const { appName, template } = req.body;
    const { appDir } = await createApp(appName, template);
    
    res.json({
      success: true,
      message: `Created ${template} app "${appName}" at ${appDir}`,
      path: appDir
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// WebSocket event handlers
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

// Start server
server.listen(PORT, () => {
  console.log(`Banana.js dev server running at:
  - HTTP: http://localhost:${PORT}
  - WebSocket: ws://localhost:${PORT}`);
  
  open(`http://localhost:${PORT}`).catch((err) => {
    console.error('Failed to open browser:', err);
  });
});