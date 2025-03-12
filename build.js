// build.js
const esbuild = require('esbuild');
const config = require('./banana.config.js');

esbuild.build({
  entryPoints: [config.entry],
  bundle: true,
  minify: config.esbuild.minify,
  sourcemap: config.esbuild.sourcemap,
  outfile: `${config.outDir}/bundle.js`,
  loader: {
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.vue': 'file',
    '.scss': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
    '.webp': 'file', // Add support for WebP
    '.webm': 'file', // Add support for WebM
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
    '.mp4': 'file',
    '.pdf': 'file',
    '.mp3': 'file',
    '.zip': 'file',
  },
}).catch(() => process.exit(1));