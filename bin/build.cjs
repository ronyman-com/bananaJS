#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// 1. Fixed paths - never change
const BIN_DIR = path.dirname(fs.realpathSync(__filename));
const PROJECT_ROOT = path.resolve(BIN_DIR, '..');
const CONFIG_PATH = path.join(BIN_DIR, 'banana.config.json');

// 2. Current working directory (where command is run from)
const WORKING_DIR = process.cwd();

// 3. Vue file loader plugin
const vuePlugin = {
  name: 'vue-loader',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async (args) => {
      const filePath = path.resolve(WORKING_DIR, args.path);
      return {
        contents: `
          import { defineComponent } from 'vue';
          const content = ${JSON.stringify(fs.readFileSync(filePath, 'utf8'))};
          export default defineComponent({
            template: \`<div>Vue file loaded: ${path.basename(args.path)}</div>\`
          });
        `,
        loader: 'js'
      };
    });
  }
};

// 4. CSS Processor
function createCssPlugin() {
  return {
    name: 'css-processor',
    async setup(build) {
      let twConfig = {};
      const twConfigPath = path.join(WORKING_DIR, 'tailwind.config.js');
      
      if (fs.existsSync(twConfigPath)) {
        twConfig = require(twConfigPath);
      }

      build.onLoad({ filter: /\.(scss|css)$/ }, async (args) => {
        try {
          const filePath = path.resolve(WORKING_DIR, args.path);
          const css = args.path.endsWith('.scss') 
            ? sass.compile(filePath).css
            : await fs.readFile(filePath, 'utf8');
          
          const result = await postcss([
            tailwindcss(twConfig),
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

// 5. Config loader with validation
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      throw new Error(`Config file not found at ${CONFIG_PATH}`);
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    
    // Validate required fields
    if (!config.entry) throw new Error('Missing "entry" in config');
    if (!config.outDir) throw new Error('Missing "outDir" in config');

    return {
      ...config,
      entry: path.resolve(WORKING_DIR, config.entry),
      outDir: path.resolve(WORKING_DIR, config.outDir),
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
          '.vue': 'js' // Handled by vuePlugin
        },
        ...config.esbuild
      }
    };
  } catch (err) {
    console.error('❌ Config error:', err.message);
    console.error('Config path:', CONFIG_PATH);
    process.exit(1);
  }
}

// 6. Build execution with file copying
async function runBuild() {
  const config = loadConfig();
  
  console.log('🏗️  Building from:', WORKING_DIR);
  console.log('📌 Using build tools from:', BIN_DIR);
  console.log('⚙️  Entry point:', path.relative(WORKING_DIR, config.entry));

  try {
    // Verify entry file exists
    if (!fs.existsSync(config.entry)) {
      throw new Error(`Entry file not found: ${config.entry}`);
    }

    // Create output directory if it doesn't exist
    fs.ensureDirSync(config.outDir);

    await esbuild.build({
      entryPoints: [config.entry],
      outdir: config.outDir,
      platform: 'browser',
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: 'vue',
      plugins: [
        createCssPlugin(),
        vuePlugin
      ],
      ...config.esbuild
    });

    // Copy required files to dist
    fs.copySync(path.join(BIN_DIR, 'cli.cjs'), path.join(config.outDir, 'bin', 'cli.cjs'));
    fs.copySync(path.join(BIN_DIR, 'server.cjs'), path.join(config.outDir, 'bin', 'server.cjs'));
    fs.copySync(path.join(PROJECT_ROOT, 'lib'), path.join(config.outDir, 'lib'));

    console.log('✅ Build successful in:', path.relative(WORKING_DIR, config.outDir));
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
}

// 7. CLI Command Handling
function handleCliCommand() {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';

  const commands = {
    build: runBuild,
    serve: () => {
      const serverPath = path.join(BIN_DIR, 'server.cjs');
      require(serverPath);
    }
  };

  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Available commands:', Object.keys(commands).join(', '));
    process.exit(1);
  }

  commands[command]();
}

// Execute
handleCliCommand();