// cli-helpers.cjs
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

async function findProjectRoot(startPath = process.cwd()) {
  let current = path.resolve(startPath);
  const rootPath = path.parse(current).root;

  while (current !== rootPath) {
    const configFiles = [
      'banana.config.js',
      'banana.config.cjs',
      'package.json'
    ].some(file => fs.existsSync(path.join(current, file)));

    if (configFiles) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return startPath;
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function runCommand(cmd, args, options = {}) {
  const proc = require('child_process').spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    ...options
  });
  
  return new Promise((resolve, reject) => {
    proc.on('close', (code) => 
      code === 0 ? resolve() : reject(new Error(`Command failed with code ${code}`))
    );
  });
}

module.exports = {
  findProjectRoot,
  getLocalIpAddress,
  runCommand
};