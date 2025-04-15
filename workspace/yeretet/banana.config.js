import { defineConfig } from 'bananajs';
import path from 'path';
import react from '@banana/plugin-react';
import tailwind from '@banana/plugin-tailwind';

export default defineConfig({
  framework: 'react',
  type: 'application',
  
  build: {
    // Updated to use .jsx extension
    entry: path.resolve(__dirname, 'src/main.jsx'),
    outDir: path.resolve(__dirname, 'dist'),
    
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: {
        '.js': 'jsx',    // Still keep this for other .js files
        '.jsx': 'jsx',   // Explicit for jsx files
        '.ts': 'tsx',
        '.tsx': 'tsx'
      },
      target: 'es2020'
    }
  },

  plugins: [
    react({
      strictMode: true,
      runtime: 'automatic'
    }),
    tailwind()
  ]
});


