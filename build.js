const esbuild = require('esbuild');
const config = require('./banana.config.js');

esbuild.build({
  entryPoints: [config.entry],
  bundle: true,
  minify: config.esbuild.minify,
  sourcemap: config.esbuild.sourcemap,
  outfile: `${config.outDir}/bundle.js`,
  loader: {
    '.js': 'jsx', // Handle JavaScript files
    '.jsx': 'jsx', // Handle JSX files
    '.css': 'css', // Handle CSS files
    '.html': 'text', // Handle HTML files as raw text
    '.png': 'file', // Handle image files
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
    '.webp': 'file',
    '.woff': 'file', // Handle font files
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
  },
})
  .then(() => console.log('banana build completed successfully!'))
  .catch(() => process.exit(1));