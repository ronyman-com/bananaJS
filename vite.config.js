import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    vue(),
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', {
            runtime: 'automatic',
            importSource: '@emotion/react'
          }]
        ]
      }
    }),
    basicSsl() // Enable HTTPS for development
  ],

  // CSS configuration
  css: {
    postcss: {
      config: fileURLToPath(new URL('./postcss.config.js', import.meta.url))
    },
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },

  // Public directory configuration
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),

  // Resolve aliases
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      'vue': 'vue/dist/vue.esm-bundler.js',
      'stream': 'stream-browserify',
      'path': 'path-browserify'
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },

  // Server configuration
  server: {
    port: 3000,
    strictPort: true,
    open: '/dashboard.html',
    https: true, // Enable HTTPS
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 3000
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    },
    middlewareMode: true,
    fs: {
      strict: false,
      allow: ['..'] // Allow serving files from project root
    }
  },

  // Preview configuration
  preview: {
    port: 3000,
    https: true,
    open: true
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        dashboard: fileURLToPath(new URL('./public/dashboard.html', import.meta.url)),
        docs: fileURLToPath(new URL('./public/docs.html', import.meta.url)),
        features: fileURLToPath(new URL('./public/features.html', import.meta.url))
      },
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'vue',
      'react',
      'react-dom',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled'
    ],
    exclude: ['js-big-decimal'],
    esbuildOptions: {
      target: 'es2020',
      supported: { 
        bigint: true 
      }
    }
  },

  // Environment variables
  define: {
    'process.env': process.env,
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});