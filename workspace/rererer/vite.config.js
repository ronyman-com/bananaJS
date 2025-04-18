import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      jsxRuntime: 'classic',
      fastRefresh: process.env.VITE_HMR === 'true'
    })
  ],
  css: {
    postcss: {
      plugins: [tailwindcss()]
    }
  },
  server: {
    port: parseInt(process.env.VITE_PORT),
    open: process.env.BROWSER !== 'none'
  },
  build: {
    outDir: process.env.VITE_OUT_DIR,
    sourcemap: process.env.VITE_SOURCE_MAP === 'true',
    minify: process.env.VITE_MINIFY === 'true'
  }
}));