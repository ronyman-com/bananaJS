
// Updated banana.config.js
import config from './banana.config.json' assert { type: 'json' };
module.exports = {
  entry: './src/main.js',
  outDir: 'dist',
  plugins: [
    require('@vitejs/plugin-vue')(),
    require('@vitejs/plugin-react')()
  ],
  esbuild: {
    minify: true,
    sourcemap: true,
    loader: {
      '.js': 'jsx', // Treat .js files as JSX
      '.jsx': 'jsx',
      '.vue': 'vue',
      '.css': 'css',
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'vue'
    ]
  }
};

