const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const multer = require('multer');
const WebSocket = require('ws');
const { exec } = require('child_process');
const logger = require('./logger'); // Assuming you have a logger
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Initialize Express app
const app = express();
const upload = multer({ dest: 'temp/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('Projects', 'public'));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Helper function to find project root
function findProjectRoot(startPath) {
  let current = path.resolve(startPath);
  const root = path.parse(current).root;
  
  while (current !== root) {
    if (fs.existsSync(path.join(current, './banana.config.js'))) {
      return current;
    }
    current = path.dirname(current);
  }
  return startPath;
}

// Helper function for promise-based exec
function execPromise(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}



// Version cache (matches your CLI)
const versionCache = new Map();
async function getLatestVersion(pkg = '@ronyman/bananajs') {
  if (versionCache.has(pkg)) return versionCache.get(pkg);
  try {
    const { stdout } = await exec(`npm view ${pkg} version`, { timeout: 2000 });
    const version = `^${stdout.trim()}`;
    versionCache.set(pkg, version);
    return version;
  } catch {
    return '^0.1.0'; // Fallback version
  }
}

app.post('/api/create-project', async (req, res) => {
  try {
    const { projectName, initGit = false } = req.body;
    
    // 1. Validate input (matches CLI exactly)
    if (!projectName || !/^[a-z0-9-]+$/i.test(projectName)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project name (letters, numbers, hyphens only)' 
      });
    }

    // 2. Set paths (use your working template location)
    const templateDir = path.join(__dirname, './templates/default');
    const projectDir = path.join(process.cwd(), projectName);

    // 3. Verify template exists
    if (!fs.existsSync(templateDir)) {
      return res.status(400).json({
        success: false,
        error: `Template not found at: ${templateDir}`,
        solution: 'Ensure default template exists in templates/default/'
      });
    }

    // 4. Create project directory
    await fs.ensureDir(projectDir);

    // 5. Copy and process files (matches CLI behavior)
    const files = await fs.readdir(templateDir);
    await Promise.all(files.map(async (file) => {
      const src = path.join(templateDir, file);
      const dest = path.join(projectDir, file);
      
      if ((await fs.stat(src)).isDirectory()) {
        await fs.copy(src, dest);
      } else {
        await fs.copy(src, dest);
        // Process template files
        if (file === 'package.json') {
          let content = await fs.readFile(dest, 'utf8');
          content = content
            .replace(/{{project-name}}/g, projectName.toLowerCase())
            .replace(/{{banana-version}}/g, await getLatestVersion())
            .replace(/{{timestamp}}/g, new Date().toISOString());
          await fs.writeFile(dest, content);
        }
      }
    }));

    // 6. Initialize Git if requested
    if (initGit) {
      try {
        await exec('git init', { cwd: projectDir });
      } catch (gitError) {
        console.warn('Git init failed:', gitError.message);
      }
    }

    res.json({
      success: true,
      message: `Project "${projectName}" created successfully`,
      projectDir
    });

  } catch (error) {
    console.error('Project creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
const server = app.listen(3000, () => {
  console.log('API server running on port 3000');
});

// WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const { type } = JSON.parse(message);
      
      if (type === 'request-metrics') {
        // Send system metrics
        const metrics = {
          type: 'metrics',
          data: {
            memory: process.memoryUsage().rss,
            cpu: Math.random() * 100, // Simplified example
            buildTime: Math.floor(Math.random() * 5000) // Simplified example
          }
        };
        ws.send(JSON.stringify(metrics));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
});