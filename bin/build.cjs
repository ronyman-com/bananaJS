// build.cjs
const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');

// Load config - CommonJS alternative for JSON imports
const configPath = path.join(__dirname, './banana.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Copy CLI files to dist
fs.copySync('./bin', './dist/bin');
fs.copySync('./lib', './dist/lib');

esbuild.build({
  entryPoints: [config.entry],
  bundle: true,
  outdir: config.outDir,
  ...config.esbuild,
  alias: config.alias
}).catch(() => process.exit(1));