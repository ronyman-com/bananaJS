#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const sass = require('sass');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

// 1. Fixed paths - never change
const BIN_DIR = path.dirname(fs.realpathSync(__filename));
const PROJECT_ROOT = path.resolve(BIN_DIR, '..');
const WORKING_DIR = process.cwd(); // Must be defined before CONFIG_PATH
const CONFIG_PATH = path.join(WORKING_DIR, 'bin/banana.config.json');

// Enhanced framework detection
function detectFramework(entryPoint) {
  try {
    // Check package.json first
    const pkgPath = path.join(WORKING_DIR, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.vue || deps['vue-router']) return 'vue';
      if (deps.react || deps['react-dom']) return 'react';
    }

    // Fallback to entry point analysis
    if (entryPoint) {
      const content = fs.readFileSync(entryPoint, 'utf8');
      if (content.includes('from \'react\'') || content.includes('from "react"')) {
        return 'react';
      } else if (content.includes('from \'vue\'') || content.includes('from "vue"')) {
        return 'vue';
      }
    }

    // Check file structure
    const vueFiles = ['App.vue', 'main.js'].some(f => 
      fs.existsSync(path.join(WORKING_DIR, 'src', f))
    );
    const reactFiles = ['App.jsx', 'main.jsx'].some(f => 
      fs.existsSync(path.join(WORKING_DIR, 'src', f))
    );

    return vueFiles ? 'vue' : reactFiles ? 'react' : 'react'; // Default to react
  } catch (err) {
    console.error('Framework detection error:', err);
    return 'react';
  }
}

// Vue plugin with better error handling (Vue 3 compatible)
const vuePlugin = {
  name: 'vue-loader',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async (args) => {
      try {
        const content = await fs.readFile(args.path, 'utf8');
        const [template, script, style] = ['template', 'script', 'style'].map(tag => {
          const match = content.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
          return match ? { 
            attrs: match[0].match(/<[^>]+>/)[0], 
            content: match[1].trim() 
          } : null;
        });

        let output = `
          import { defineComponent } from 'vue';
          ${script?.content || 'export default {}'}
          ${template ? `Component.template = \`${template.content}\`;` : ''}
          export default Component;
        `;

        if (style) {
          const isScoped = style.attrs.includes(' scoped');
          output += `
            const style = document.createElement('style');
            style.textContent = \`${style.content}\`;
            ${isScoped ? 'style.setAttribute("scoped", "");' : ''}
            document.head.appendChild(style);
          `;
        }

        return { contents: output, loader: 'js' };
      } catch (err) {
        return { errors: [{ text: `Vue file processing error: ${err.message}` }] };
      }
    });
  }
};

// React plugin with TS support
const reactPlugin = {
  name: 'react-jsx',
  setup(build) {
    build.onLoad({ filter: /\.(jsx|tsx)$/ }, async (args) => {
      const contents = await fs.readFile(args.path, 'utf8');
      return { 
        contents,
        loader: args.path.endsWith('tsx') ? 'tsx' : 'jsx'
      };
    });
  }
};

// CSS processor with caching
function createCssPlugin() {
  let cachedTwConfig = null;
  
  return {
    name: 'css-processor',
    async setup(build) {
      build.onLoad({ filter: /\.(scss|css)$/ }, async (args) => {
        try {
          // Get Tailwind config once
          if (!cachedTwConfig) {
            const twPath = path.join(WORKING_DIR, 'tailwind.config.js');
            cachedTwConfig = fs.existsSync(twPath) ? require(twPath) : {};
          }

          // Process CSS
          const filePath = path.resolve(WORKING_DIR, args.path);
          const css = args.path.endsWith('.scss') 
            ? sass.compile(filePath).css
            : await fs.readFile(filePath, 'utf8');
          
          const result = await postcss([
            tailwindcss(cachedTwConfig),
            autoprefixer
          ]).process(css, { from: args.path });
          
          return { contents: result.css, loader: 'css' };
        } catch (err) {
          console.error(`❌ Failed to process ${path.relative(WORKING_DIR, args.path)}:`, err.message);
          return { errors: [{ text: err.message }] };
        }
      });
    }
  };
}

// Config loader with validation and defaults
async function loadConfig() {
  const defaults = {
    entry: './src/main.js',
    outDir: './dist',
    esbuild: {
      bundle: true,
      minify: true,
      sourcemap: true,
      target: ['es2020'],
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
        '.css': 'css',
        '.scss': 'css',
        '.vue': 'js'
      }
    }
  };

  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.log('ℹ️ No config file found, using defaults');
      return {
        ...defaults,
        entry: path.resolve(WORKING_DIR, defaults.entry),
        outDir: path.resolve(WORKING_DIR, defaults.outDir)
      };
    }

    const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
    
    if (!config.entry) throw new Error('Missing "entry" in config');
    if (!config.outDir) throw new Error('Missing "outDir" in config');

    return {
      ...defaults,
      ...config,
      entry: path.resolve(WORKING_DIR, config.entry),
      outDir: path.resolve(WORKING_DIR, config.outDir),
      esbuild: {
        ...defaults.esbuild,
        ...(config.esbuild || {})
      }
    };
  } catch (err) {
    console.error('❌ Config error:', err.message);
    console.error('Config path:', CONFIG_PATH);
    process.exit(1);
  }
}

// Build execution with framework detection
async function runBuild() {
  const config = await loadConfig();
  const framework = detectFramework(config.entry);
  
  console.log(`🏗️  Building ${framework.toUpperCase()} project from: ${WORKING_DIR}`);
  console.log('⚙️  Entry point:', path.relative(WORKING_DIR, config.entry));

  try {
    if (!fs.existsSync(config.entry)) {
      throw new Error(`Entry file not found: ${config.entry}`);
    }

    await fs.ensureDir(config.outDir);

    const plugins = [createCssPlugin()];
    const baseConfig = {
      entryPoints: [config.entry],
      outdir: config.outDir,
      bundle: true,
      minify: true,
      sourcemap: true,
      target: ['es2020'],
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
        '.css': 'css',
        '.scss': 'css',
        '.vue': 'js'
      }
    };

    if (framework === 'vue') {
      plugins.push(vuePlugin);
      Object.assign(baseConfig, {
        jsx: 'automatic',
        jsxImportSource: 'vue'
      });
    } else if (framework === 'react') {
      plugins.push(reactPlugin);
      Object.assign(baseConfig, {
        jsx: 'automatic',
        jsxImportSource: 'react'
      });
    }

    await esbuild.build({
      ...baseConfig,
      plugins,
      ...config.esbuild
    });

    // Copy required files
    await Promise.all([
      fs.copy(path.join(BIN_DIR, 'cli.cjs'), path.join(config.outDir, 'bin/cli.cjs')),
      fs.copy(path.join(BIN_DIR, 'server.cjs'), path.join(config.outDir, 'bin/server.cjs')),
      fs.existsSync(path.join(PROJECT_ROOT, 'lib')) && 
        fs.copy(path.join(PROJECT_ROOT, 'lib'), path.join(config.outDir, 'lib')),
      fs.existsSync(path.join(WORKING_DIR, 'public')) && 
        fs.copy(path.join(WORKING_DIR, 'public'), config.outDir)
    ]);

    console.log('✅ Build successful in:', path.relative(WORKING_DIR, config.outDir));
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
}

// Development server with watch mode
async function runDev() {
  const config = await loadConfig();
  const framework = detectFramework(config.entry);
  
  console.log(`👀 Starting development server for ${framework.toUpperCase()} project...`);

  const plugins = [createCssPlugin()];
  const baseConfig = {
    entryPoints: [config.entry],
    outdir: config.outDir,
    bundle: true,
    minify: false,
    sourcemap: true,
    target: ['es2020'],
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.ts': 'tsx',
      '.tsx': 'tsx',
      '.css': 'css',
      '.scss': 'css',
      '.vue': 'js'
    }
  };

  if (framework === 'vue') {
    plugins.push(vuePlugin);
    Object.assign(baseConfig, {
      jsx: 'automatic',
      jsxImportSource: 'vue'
    });
  } else if (framework === 'react') {
    plugins.push(reactPlugin);
    Object.assign(baseConfig, {
      jsx: 'automatic',
      jsxImportSource: 'react'
    });
  }

  const ctx = await esbuild.context({
    ...baseConfig,
    plugins,
    ...config.esbuild
  });
  
  await ctx.watch();
  console.log('🔄 Watching for file changes...');
  
  // Start development server
  const serverPath = path.join(BIN_DIR, 'server.cjs');
  require(serverPath);
}

// CLI Command Handling
async function handleCliCommand() {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';

  const commands = {
    build: runBuild,
    serve: () => {
      const serverPath = path.join(BIN_DIR, 'server.cjs');
      require(serverPath);
    },
    dev: runDev
  };

  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Available commands:', Object.keys(commands).join(', '));
    process.exit(1);
  }

  await commands[command]();
}

// Execute
handleCliCommand().catch(err => {
  console.error('Command failed:', err);
  process.exit(1);
});