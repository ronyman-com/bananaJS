const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to handle .html extension and clean URLs
app.use((req, res, next) => {
  // Check if the request has no file extension
  if (!path.extname(req.path)) {
    const filePath = path.join(__dirname, '../public', `${req.path}.html`);
    
    // Check if the HTML file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File doesn't exist, continue to next middleware
        next();
      } else {
        // File exists, serve it
        res.sendFile(filePath);
      }
    });
  } else {
    // Request has an extension, continue normally
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
      cpu: 0, // You'd need a real CPU monitoring solution
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
        // Send updated metrics
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


// Add these routes to your server.js
const { createApp, createProject } = require('../lib/shared/create-utils.cjs');
const express = require('express');
const router = express.Router();

router.post('/api/create/app', express.json(), async (req, res) => {
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

router.post('/api/create/project', express.json(), async (req, res) => {
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

app.use(router);