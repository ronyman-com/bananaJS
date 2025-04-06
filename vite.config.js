import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [] // Add Babel plugins if needed
      }
    })
  ],

  publicDir: 'public',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue': 'vue/dist/vue.esm-bundler.js',
      'react': 'react',
      'react-dom': 'react-dom/client'
    }
  },

  server: {
    port: 3000,
    open: true,
    hmr: {
      protocol: 'ws',
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
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  },

  build: {
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url))
      }
    }
  },

  optimizeDeps: {
    include: [
      'vue',
      'react',
      'react-dom'
    ],
    exclude: []
  }
});