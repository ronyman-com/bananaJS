// banana.config.js
module.exports = {
  entry: './src/main.jsx', // Point to React entry
  outDir: 'dist',
  framework: 'react', // Default framework
  plugins: {
    react: require('@vitejs/plugin-react')(),
    vue: require('@vitejs/plugin-vue')() // Optional for subprojects
  },
  esbuild: {
    jsx: 'automatic', // React 17+ JSX transform
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.css': 'css'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom','xterm',
      'xterm-addon-fit']
  },
  build: {
    rollupOptions: {
      external: ['xterm', 'xterm-addon-fit'] // Prevent bundling issues
    }
  }
};