import esbuild from 'esbuild';
import config from './banana.config.json' assert { type: 'json' };
const fs = require('fs-extra');

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