const esbuild = require('esbuild');
const config = require('./banana.config.js');

esbuild.build({
  entryPoints: [config.entry],
  bundle: true,
  minify: config.esbuild.minify,
  sourcemap: config.esbuild.sourcemap,
  outfile: `${config.outDir}/bundle.js`,
  loader: {
    '.js': 'jsx',
    '.vue': 'file',
    '.css': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
    '.webp': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
  },
})
  .then(() => console.log('banana build completed successfully!'))
  .catch(() => process.exit(1));