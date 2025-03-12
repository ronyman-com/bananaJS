module.exports = {
    entry: './src/main.js', // Entry point for the application
    outDir: 'dist',         // Output directory for production builds
    plugins: [],            // Custom plugins (if any)
    esbuild: {
      minify: true,        // Minify production builds
      sourcemap: true,     // Generate source maps
    },
  };