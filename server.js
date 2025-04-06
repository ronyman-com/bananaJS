import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import open from 'open';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import http from 'http';


// server.js design for CLI
const { createApp } = require('./lib/create-app');
// Get directory name equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ server });

// Middleware to track build start time
let buildStartTime;
let hmrUpdateTime;
app.use((req, res, next) => {
  buildStartTime = Date.now();
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use(express.json());

// Watch for file changes (for HMR)
const watcher = chokidar.watch(['./public', './src'], {
  ignored: /node_modules/,
  persistent: true,
});

// Send metrics to clients periodically
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const metrics = {
    memory: memoryUsage.rss / 1024 / 1024,
    cpu: process.cpuUsage().user / 1000,
    buildTime: buildStartTime ? Date.now() - buildStartTime : 0,
    hmrUpdateTime: hmrUpdateTime || 0,
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(JSON.stringify({ type: 'metrics', data: metrics }));
    }
  });
}, 1000);

// File change handler
watcher.on('change', (filePath) => {
  hmrUpdateTime = Date.now() - buildStartTime;
  console.log(`HMR update took ${hmrUpdateTime}ms`);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(JSON.stringify({ 
        type: 'update', 
        file: path.relative(process.cwd(), filePath),
        time: hmrUpdateTime
      }));
    }
  });
});

// Routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

app.post('/api/create-app', (req, res) => {
  const { appName, template } = req.body;
  const appDir = path.join(process.cwd(), appName);

  try {
    if (fs.existsSync(appDir)) {
      return res.status(400).json({ success: false, message: `App "${appName}" already exists.` });
    }

    const templateDir = path.join(__dirname, `templates/${template}`);
    if (!fs.existsSync(templateDir)) {
      return res.status(400).json({ success: false, message: `Template "${template}" does not exist.` });
    }

    fs.copySync(templateDir, appDir);
    res.json({ success: true, message: `App "${appName}" created successfully with ${template} template!` });
  } catch (error) {
    console.error('Error creating app:', error);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
});





// API endpoint for dashboard
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




// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Banana.js dev server running at:
  - HTTP: http://localhost:${PORT}
  - WebSocket: ws://localhost:${PORT}`);
  
  open(`http://localhost:${PORT}`).catch((err) => {
    console.error('Failed to open browser:', err);
  });
});