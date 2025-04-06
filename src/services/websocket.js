import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import open from 'open';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import http from 'http';

// Get directory name equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ server });

// WebSocket HMR initialization function
export function initHMRWebSocket(vueInstance) {
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  
  ws.addEventListener('open', () => {
    console.log('Connected to HMR server');
  });

  ws.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'metrics') {
        vueInstance.buildTime = message.data.buildTime;
        vueInstance.hmrUpdateTime = message.data.hmrUpdateTime;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.addEventListener('error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  ws.addEventListener('close', (event) => {
    console.log(event.wasClean ? 'Connection closed cleanly' : 'Connection abruptly closed');
  });

  return ws;
}

// Express middleware and routes
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// File watching for HMR
const watcher = chokidar.watch(['./src', './public'], {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: true
});

let buildStartTime;
let hmrUpdateTime;

watcher.on('change', (filePath) => {
  hmrUpdateTime = Date.now() - buildStartTime;
  console.log(`File changed: ${filePath} (${hmrUpdateTime}ms)`);
  
  // Notify all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(JSON.stringify({
        type: 'update',
        file: path.relative(process.cwd(), filePath),
        time: Date.now()
      }));
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  open(`http://localhost:${PORT}`).catch(console.error);
});