// banana.config.js
import { defineConfig } from 'bananajs';
import react from '@banana/plugin-react';
import tailwind from '@banana/plugin-tailwind';

export default defineConfig({
  // Core Configuration
  framework: 'react',
  type: 'application',
  basePath: process.env.VITE_BASE_PATH || '/',
  
  // Build Configuration
  build: {
    outDir: process.env.VITE_OUT_DIR || 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.VITE_SOURCE_MAP !== 'false',
    minify: process.env.VITE_MINIFY === 'true',
    cssCodeSplit: true,
    
    // ESBuild options (matches your package.json dependency)
    esbuild: {
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      target: 'es2020'
    }
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    open: process.env.BROWSER !== 'none',
    hmr: process.env.VITE_HMR === 'true'
  },

  // CSS Configuration
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "${process.env.VITE_SASS_PATH || './src/styles'}/variables.scss";`
      }
    },
    postcss: {
      config: process.env.VITE_POSTCSS_CONFIG || './postcss.config.js'
    }
  },

  // Plugins
  plugins: [
    react({
      strictMode: process.env.VITE_REACT_STRICT_MODE === 'true',
      runtime: 'classic'
    }),
    tailwind({
      config: process.env.VITE_TAILWIND_CONFIG || './tailwind.config.js'
    })
  ],

  // Project-specific overrides
  project: {
    react: {
      version: '^18.0.0',
      router: false // Set to true if using react-router
    },
    typescript: {
      enabled: true,
      version: '^5.0.0'
    }
  },

  // CLI-specific settings
  cli: {
    binPath: './.bin/cli.cjs',
    commands: {
      dev: {
        defaultPort: 3000,
        openBrowser: true
      },
      build: {
        cssOnlyFlag: '--css',
        cssOutputPath: 'public/styles/banana.css'
      }
    }
  }
});