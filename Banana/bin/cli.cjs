#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');

const command = process.argv[2];
const args = process.argv.slice(3);

function runDev() {
  const vite = spawn('vite', [], { 
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  vite.on('error', (err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });
}

function runBuild() {
  const vite = spawn('vite', ['build'], { 
    stdio: 'inherit',
    shell: true
  });
  vite.on('error', (err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}

function runServe() {
  const app = express();
  const port = process.env.PORT || 3000;
  
  // Serve static files from dist directory
  app.use(express.static(path.join(__dirname, '../../dist')));
  
  // SPA fallback - only for HTML5 history API routes
  app.get('*', (req, res) => {
    if (req.path.includes('.')) {
      return res.status(404).send('Not found');
    }
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

function runBuildCss() {
  const tailwind = spawn('tailwindcss', [
    '-i', './src/styles/main.css',
    '-o', './public/styles/banana.css',
    '--minify'
  ], { stdio: 'inherit', shell: true });
  
  tailwind.on('error', (err) => {
    console.error('CSS build failed:', err);
    process.exit(1);
  });
}

switch(command) {
  case 'dev':
    runDev();
    break;
  case 'serve':
  case 'start':
    runServe();
    break;
  case 'build':
    runBuild();
    break;
  case 'build-css':
    runBuildCss();
    break;
  case 'create-app':
    require('../lib/create-app.cjs')();
    break;
  case 'create-project':
    require('../lib/create-project.cjs')();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}