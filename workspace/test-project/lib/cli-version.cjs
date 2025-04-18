// lib/cli-version.cjs
const path = require('path');
const fs = require('fs-extra');

// Simple coloring alternatives
const styles = {
  debug: (msg) => `\x1b[33m${msg}\x1b[0m`, // Yellow
  success: (msg) => `\x1b[32m✔ ${msg}\x1b[0m`, // Green
  error: (msg) => `\x1b[31m✖ ${msg}\x1b[0m`, // Red
  path: (msg) => `\x1b[34m${msg}\x1b[0m`, // Blue
  version: (msg) => `\x1b[93m${msg}\x1b[0m` // Bright Yellow
};

function getVersion() {
  try {
    const packagePath = path.join(__dirname, '../package.json');
    console.log(styles.debug('Looking for package.json at:'));
    console.log(styles.path(packagePath));

    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }

    const packageData = fs.readJsonSync(packagePath);
    const version = packageData.version || '0.0.0';
    
    console.log(styles.success(`Version ${styles.version(version)} found`));
    return version;

  } catch (err) {
    console.log(styles.error(`Error reading version: ${err.message}`));
    return '0.0.0';
  }
}

module.exports = {
  version: getVersion(),
  getVersion,
  styles
};