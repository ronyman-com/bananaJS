const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// 1. Fixed paths
const BIN_DIR = path.dirname(fs.realpathSync(__filename));
const PROJECT_ROOT = path.resolve(BIN_DIR, '..');
const CONFIG_PATH = path.join(BIN_DIR, 'banana.config.json');

// 2. Current working directory
const WORKING_DIR = process.cwd();

// 3. Vue file loader plugin
const vuePlugin = {
  name: 'vue-loader',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async (args) => {
      return {
        contents: `
          import { defineComponent } from 'vue';
          const content = ${JSON.stringify(fs.readFileSync(args.path, 'utf8'))};
          export default defineComponent({
            template: \`<div>Vue file loaded: ${path.basename(args.path)}</div>\`
          });
        `,
        loader: 'js'
      };
    });
  }
};

// 4. Config loader
function loadConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    
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
          '.vue': 'js' // Vue files will be handled by our plugin
        },
        ...config.esbuild
      }
    };
  } catch (err) {
    console.error('❌ Config error:', err.message);
    process.exit(1);
  }
}

// 5. Build execution
async function build() {
  const config = loadConfig();
  
  console.log('🏗️  Building from:', WORKING_DIR);
  console.log('📌 Using build tools from:', BIN_DIR);

  try {
    await esbuild.build({
      entryPoints: [config.entry],
      outdir: config.outDir,
      platform: 'browser',
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: 'vue',
      plugins: [vuePlugin],
      ...config.esbuild
    });

    console.log('✅ Build successful in:', path.relative(WORKING_DIR, config.outDir));
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
}

build();