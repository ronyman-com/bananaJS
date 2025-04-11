const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const multer = require('multer');
const WebSocket = require('ws');
const { exec } = require('child_process');

// Initialize Express app
const app = express();
const upload = multer({ dest: 'temp/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Helper function to find project root
function findProjectRoot(startPath) {
  let current = path.resolve(startPath);
  const root = path.parse(current).root;
  
  while (current !== root) {
    if (fs.existsSync(path.join(current, 'banana.config.js'))) {
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

const logger = require('./logger'); // Assuming you have a logger

app.post('/api/create-project', async (req, res) => {
    const { projectName, initGit = false } = req.body;
    
    // 1. Input validation (matches CLI exactly)
    if (!projectName || !/^[a-z0-9-]+$/i.test(projectName)) {
        logger.warn(`Invalid project name: ${projectName}`);
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid project name (letters, numbers, hyphens only)'
        });
    }

    // 2. Path setup (matches CLI exactly)
    const projectDir = path.join(process.cwd(), projectName);
    const templateDir = path.join(__dirname, '../Projects/templates/default');
    
    logger.debug(`Project directory: ${projectDir}`);
    logger.debug(`Template directory: ${templateDir}`);

    // 3. Verify paths
    if (fs.existsSync(projectDir)) {
        logger.warn(`Project already exists: ${projectDir}`);
        return res.status(400).json({
            success: false,
            message: `Project "${projectName}" already exists`
        });
    }

    if (!fs.existsSync(templateDir)) {
        logger.error(`Template not found at: ${templateDir}`);
        return res.status(500).json({
            success: false,
            message: 'Project template not found',
            details: {
                expected: 'Projects/templates/default',
                actual: templateDir,
                solution: 'Create template in Projects/templates/default/'
            }
        });
    }

    try {
        // 4. Create project (same as CLI)
        logger.info(`Creating project "${projectName}" from template...`);
        await fs.ensureDir(projectDir);
        await fs.copy(templateDir, projectDir);

        // 5. Process package.json (same as CLI)
        const pkgPath = path.join(projectDir, 'package.json');
        if (await fs.pathExists(pkgPath)) {
            let content = await fs.readFile(pkgPath, 'utf8');
            content = content
                .replace(/{{project-name}}/g, projectName.toLowerCase())
                .replace(/{{banana-version}}/g, '^0.1.0') // Or fetch dynamically
                .replace(/{{timestamp}}/g, new Date().toISOString());
            await fs.writeFile(pkgPath, content);
        }

        // 6. Initialize Git (if requested)
        if (initGit) {
            try {
                await require('child_process').exec('git init', { cwd: projectDir });
                logger.debug('Initialized Git repository');
            } catch (gitError) {
                logger.warn('Git init failed:', gitError.message);
            }
        }

        logger.info(`Project created successfully: ${projectDir}`);
        res.json({
            success: true,
            message: `Project "${projectName}" created successfully!`,
            projectDir: path.normalize(projectDir)
        });

    } catch (error) {
        logger.error('Project creation failed:', error);
        
        // Cleanup on failure (same as CLI)
        if (await fs.pathExists(projectDir)) {
            await fs.remove(projectDir).catch(() => {});
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create project',
            error: error.message
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