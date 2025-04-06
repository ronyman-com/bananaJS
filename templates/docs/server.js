const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const open = require('open'); // Import the open package

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Watch for file changes (for HMR)
const watcher = chokidar.watch('./public', {
  ignored: /node_modules/,
  persistent: true,
});

watcher.on('change', (filePath) => {
  console.log(`File changed: ${filePath}`);
  // Implement HMR logic here (e.g., notify the client)
});

// WebSocket for HMR
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Start the server and open the browser
app.listen(PORT, () => {
  console.log(`Banana.js dev server running at http://localhost:${PORT}`);

  // Automatically open the browser
  open(`http://localhost:${PORT}`).catch((err) => {
    console.error('Failed to open browser:', err);
  });
});