const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const open = require('open');

const wss = new WebSocket.Server({ port: 8080 });
const app = express();
const PORT = 5000;
let buildStartTime;
let hmrUpdateTime;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Watch for file changes (for HMR)
const watcher = chokidar.watch('./public', {
  ignored: /node_modules/,
  persistent: true,
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// Middleware to log build start time
app.use((req, res, next) => {
  buildStartTime = Date.now();
  next();
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Watch for file changes and notify clients
watcher.on('change', (filePath) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'update', file: filePath }));
    }
  });
  hmrUpdateTime = Date.now() - buildStartTime;
  console.log(`HMR update took ${hmrUpdateTime}ms`);
});

// Send performance metrics to clients
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const metrics = {
    memory: memoryUsage.rss / 1024 / 1024, // RSS in MB
    cpu: process.cpuUsage().user / 1000, // CPU in ms
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'metrics', data: metrics }));
    }
  });
}, 1000);

// Start the server and open the browser
app.listen(PORT, () => {
  console.log(`Banana.js dev server running at http://localhost:${PORT}`);
  open(`http://localhost:${PORT}`).catch((err) => {
    console.error('Failed to open browser:', err);
  });
});