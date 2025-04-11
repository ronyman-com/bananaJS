import { WebSocketServer } from 'ws';
import http from 'http';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BananaWebSocket {
  constructor(port = 5000) {
    this.port = port;
    this.server = http.createServer();
    this.wss = new WebSocketServer({ server: this.server });
    this.clients = new Set();
    this.watcher = null;
    this.buildStartTime = null;
  }

  init() {
    this.setupWebSocket();
    this.setupFileWatcher();
    this.startServer();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('New client connected');

      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  setupFileWatcher() {
    this.watcher = chokidar.watch(['./src', './public'], {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', (filePath) => {
      this.handleFileChange(filePath);
    });
  }

  handleMessage(ws, message) {
    try {
      const parsed = JSON.parse(message);
      console.log('Received:', parsed);
      
      // Handle different message types
      switch(parsed.type) {
        case 'build-start':
          this.buildStartTime = Date.now();
          break;
        case 'request-update':
          ws.send(JSON.stringify({ type: 'status', data: 'ready' }));
          break;
        default:
          this.broadcast(message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  handleFileChange(filePath) {
    const hmrUpdateTime = Date.now() - this.buildStartTime;
    console.log(`File changed: ${filePath} (${hmrUpdateTime}ms)`);
    
    this.broadcast({
      type: 'update',
      file: path.relative(process.cwd(), filePath),
      time: hmrUpdateTime
    });
  }

  broadcast(message) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocketServer.OPEN) {
        client.send(payload);
      }
    });
  }

  startServer() {
    this.server.listen(this.port, () => {
      console.log(`WebSocket server running on ws://localhost:${this.port}`);
    });
  }
}

// Export singleton instance
export const webSocketService = new BananaWebSocket();