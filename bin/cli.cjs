#!/usr/bin/env node
// BananaJS CLI - Modern JavaScript Framework Toolkit

// CommonJS requires (for non-ESM packages)
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const handler = require('serve-handler');
const http = require('http');
const os = require('os');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk'); 




// Local modules
const { version } = require('../lib/cli-version.cjs');
const { findProjectRoot, getLocalIpAddress, runCommand } = require('./cli-helpers.cjs');;



// Load createFile function with proper error handling
let createFile;
try {
  const createFilePath = path.resolve(__dirname, '../lib/create-file.cjs');
  const createFileModule = require(createFilePath);
  
  if (typeof createFileModule?.createFile === 'function') {
    createFile = createFileModule.createFile;
  } else if (typeof createFileModule === 'function') {
    createFile = createFileModule;
  } else {
    throw new Error('Module does not export a valid createFile function');
  }
} catch (err) {
  console.error(chalk.red('✖ Failed to load createFile:'));
  console.error(chalk.red(err.message));
  console.error(chalk.dim('Check if the file exists at: lib/create-file.cjs'));
  process.exit(1);
}

// Load createFolder function with the same pattern
let createFolder;
try {
  const createFolderPath = path.resolve(__dirname, '../lib/create-folder.cjs');
  const createFolderModule = require(createFolderPath);
  
  if (typeof createFolderModule?.createFolder === 'function') {
    createFolder = createFolderModule.createFolder;
  } else if (typeof createFolderModule === 'function') {
    createFolder = createFolderModule;
  } else {
    throw new Error('Module does not export a valid createFolder function');
  }
} catch (err) {
  console.error(chalk.red('✖ Failed to load createFolder:'));
  console.error(chalk.red(err.message));
  process.exit(1);
}


// Load upload functions with proper error handling
let upload;
try {
  const uploadPath = path.resolve(__dirname, '../lib/upload.cjs');
  const uploadModule = require(uploadPath);
  
  if (typeof uploadModule?.handleUpload === 'function' && 
      typeof uploadModule?.processUpload === 'function') {
    upload = uploadModule;
  } else {
    throw new Error('Module does not export required upload functions');
  }
} catch (err) {
  console.error(chalk.red('✖ Failed to load upload module:'));
  console.error(chalk.red(err.message));
  console.error(chalk.dim('Check if the file exists at: lib/upload.cjs'));
  process.exit(1);
}


// Load createApp function with proper error handling
let createApp;
try {
  const createAppPath = path.resolve(__dirname, '../lib/create-app.cjs');
  const createAppModule = require(createAppPath);
  
  if (typeof createAppModule?.createApp === 'function') {
    createApp = createAppModule.createApp;
  } else if (typeof createAppModule === 'function') {
    createApp = createAppModule;
  } else {
    throw new Error('Module does not export a valid createApp function');
  }
} catch (err) {
  console.error('Failed to load createApp:', err);
  process.exit(1);
}

// Async wrapper for ESM imports
(async () => {
  let chalk, gradient, figlet, boxen;
  try {
    // Dynamic imports for ESM packages
    ({ default: chalk } = await import('chalk'));
    ({ default: gradient } = await import('gradient-string'));
    ({ default: figlet } = await import('figlet'));
    ({ default: boxen } = await import('boxen'));

    // Style configuration
    const primaryGradient = gradient('cyan', 'violet');
    const secondaryGradient = gradient('pink', 'orange');
    
    const styles = {
      error: chalk.bold.red,
      success: chalk.bold.green,
      warning: chalk.yellow,
      info: chalk.cyan,
      command: chalk.bold.yellow,
      option: chalk.italic.gray,
      file: chalk.blueBright,
      highlight: chalk.bold.cyan
    };

    // Banner display
    const showBanner = () => {
      console.log(
        boxen(
          primaryGradient(
            figlet.textSync('BananaJS', {
              horizontalLayout: 'full',
              font: 'ANSI Shadow'
            })
          ) +
          `\n${secondaryGradient('A modern JavaScript framework toolkit')}\n` +
          chalk.gray(`Version ${version}`),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
          }
        )
      );
    };

    // ========================
    // CLI PROGRAM SETUP
    // ========================
    program
      .name('banana')
      .version(version, '-v, --version', `Display version (current: ${version})`)
      .description('BananaJS CLI - The sweetest way to build web apps')
      .usage('[command] [options]')
      .addHelpText('before', 
        boxen(
          styles.info('BananaJS CLI - Project Management') + '\n\n' +
          'Usage:\n  ' + styles.command('banana [command] [options]') + '\n\n' +
          'Examples:\n' + 
          `  ${styles.command('banana create my-app --react')} ${styles.option('# Create React app')}\n` +
          `  ${styles.command('banana dev --port 5000')} ${styles.option('# Start dev server')}\n` +
          `  ${styles.command('banana build --css')} ${styles.option('# Build css')}`,
          { padding: 1, borderColor: 'blue', margin: 1 }
        )
      )
      .addHelpText('after', 
        boxen(
          styles.info('Command Categories:') + '\n' +
          '\n' + styles.highlight('🏗️  Project Creation:') +
          `\n  banana create-project   Create new project` +
          `\n  banana create-app --template react   Create new React app` +
          `\n  banana create-app --template vue   Create new Vue app` +
          `\n  banana create-file   Create new file in any .extenson` +
          `\n  banana create-folder Create new folder` +
          `\n  banana upload <file or folder>  -d ./uploads   upload folder and file` +
          `\n  banana dev to start development server` +
          `\n  init                  Alias for create` +
          '\n\n' + styles.highlight('🚀 Development:') +
          `\n  dev [--port]          Start dev server (default: 3000)` +
          `\n  test [--watch]        Run tests` +
          '\n\n' + styles.highlight('📦 Build & Deploy:') +
          `\n  build [--analyze]     Production build with analysis` +
          `\n  deploy [--env]        Deploy to specified environment` +
          '\n\n' + styles.highlight('🛠️  Configuration:') +
          `\n  config                Manage project configuration` +
          `\n\n${styles.highlight('Run')} ${styles.command('banana <command> --help')} ${styles.highlight('for detailed usage')}` +
          `\n\n${styles.warning('Need help? https://bananajs.com/')}`,
          { padding: 1, borderColor: 'magenta', margin: 1 }
        )
      )
      .showHelpAfterError('(add --help for additional information)')
      .option('--verbose', 'Show detailed output', false)
      .option('--debug', 'Show debug information', false);


// ==============================================
// Create File Command
// ==============================================
program
  .command('create-file <filename>')
  .description('Create a new file with optional template')
  .option('-t, --template <type>', 'Template type (js, ts, react, html, css)')
  .option('-d, --directory <path>', 'Target directory', process.cwd())
  .action(async (filename, options) => {
    try {
      const filePath = path.join(options.directory, filename);
      const result = await createFile(filePath, {
        template: options.template || 'empty'
      });
      
      console.log(chalk.green(`✓ File created: ${result.path}`));
      console.log(chalk.dim(`Size: ${result.size} bytes`));
    } catch (err) {
      console.error(chalk.red(`✖ Error: ${err.message}`));
      process.exit(1);
    }
  });

// ==============================================
// Create Folder Command
// ==============================================
program
  .command('create-folder <foldername>')
  .description('Create a new folder')
  .option('-d, --directory <path>', 'Parent directory', process.cwd())
  .option('-r, --recursive', 'Create parent directories if needed')
  .action(async (foldername, options) => {
    try {
      const folderPath = path.join(options.directory, foldername);
      const result = await createFolder(folderPath, {
        recursive: options.recursive
      });
      
      console.log(chalk.green(`✓ Folder created: ${result.path}`));
      console.log(chalk.dim(`Permissions: ${result.permissions}`));
    } catch (err) {
      console.error(chalk.red(`✖ Error: ${err.message}`));
      process.exit(1);
    }
  });
// ==============================================
// Upload Command (Interactive)
// ==============================================
// Simple file copy function
async function copyFile(source, targetDir) {
  try {
    await fs.access(source); // Check if source exists
    const stats = await fs.stat(source);
    if (!stats.isFile()) throw new Error('Not a regular file');

    const filename = path.basename(source);
    const destPath = path.join(targetDir, filename);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.copyFile(source, destPath);

    return {
      source,
      destination: destPath,
      size: stats.size,
      success: true
    };
  } catch (err) {
    return {
      source,
      success: false,
      error: err.message
    };
  }
}

// Upload command using direct arguments
program
  .command('upload <files...>')
  .description('Upload files to a directory')
  .option('-d, --dir <directory>', 'Target directory', process.cwd())
  .action(async (files, options) => {
    console.log(chalk.blue(`\nUploading ${files.length} file(s) to ${options.dir}`));

    const results = await Promise.all(
      files.map(file => copyFile(file, options.dir))
    );

    // Display results
    let successCount = 0;
    results.forEach(result => {
      if (result.success) {
        console.log(chalk.green(`✓ ${path.basename(result.source)} → ${result.destination}`));
        successCount++;
      } else {
        console.log(chalk.red(`✖ ${path.basename(result.source)}: ${result.error}`));
      }
    });

    // Summary
    console.log(chalk.blue.bold(`\nCompleted: ${successCount}/${files.length} files uploaded`));
    process.exit(successCount === files.length ? 0 : 1);
  });



// ========================
// COMMAND: CREATE PROJECT
// ========================
program
.command('create-project <project-name>')
.description('Initialize a new BananaJS project with default template')
.option('--yarn', 'Use yarn instead of npm', false)
.option('--git', 'Initialize git repository', false)
.action(async (projectName, options) => {
  showBanner();
  console.log(primaryGradient('\n🚀 Creating new BananaJS project...\n'));

  // Validate project name (browser-safe)
  if (!/^[a-z0-9-]+$/i.test(projectName)) {
    console.error(styles.error('✖ Invalid project name (only letters, numbers, and hyphens allowed)'));
    if (typeof window !== 'undefined') {
      throw new Error('Invalid project name');
    }
    process.exit(1);
  }

  // Create workspace directory if it doesn't exist
  const workspaceDir = path.join(process.cwd(), 'workspace');
  try {
    await fs.ensureDir(workspaceDir);
  } catch (err) {
    console.error(styles.error('✖ Failed to create workspace directory:'), err.message);
    process.exit(1);
  }

  const projectDir = path.join(workspaceDir, projectName); // Changed to workspace directory
  const packageManager = options.yarn ? 'yarn' : 'npm';
  const templateDir = path.resolve(__dirname, '../Projects/templates/default');

  try {
    // Check if project exists (Node-only)
    if (typeof window === 'undefined' && fs.existsSync(projectDir)) {
      throw new Error(`Project "${projectName}" already exists in workspace`);
    }

    // Verify template exists (Node-only)
    if (typeof window === 'undefined' && !fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found at: ${templateDir}\n` +
                    `Please ensure the default template exists in Projects/templates/default`);
    }

    console.log(styles.highlight(`Setting up project: ${projectName}`));
    console.log(styles.highlight(`Location: workspace/${projectName}`));
    console.log(styles.highlight(`Using package manager: ${packageManager}`));

    // Node.js filesystem operations
    await fs.ensureDir(projectDir);
    await fs.copy(templateDir, projectDir);

    // Rest of your existing template processing code remains the same...
    // ... [keep all the template file processing code]

    // Success message with workspace path
    console.log(styles.success('\n✔ Project ready in workspace!'));
    console.log(
      boxen(
        styles.highlight('Next steps:') +
        `\n\n${styles.command(`cd workspace/${projectName}`)}` +
        `\n${styles.command(`${packageManager} install`)}` +
        `\n${styles.command(`${packageManager} run dev`)}`,
        { 
          padding: 1,
          borderColor: 'green',
          margin: 1
        }
      )
    );

  } catch (err) {
    console.error(styles.error('\n✖ Project creation failed:'), err.message);
    
    // Clean up (Node-only)
    if (typeof window === 'undefined' && fs.existsSync(projectDir)) {
      await fs.remove(projectDir).catch(() => {});
    }
    
    process.exit(1);
  }
})
.addHelpText('after',
  boxen(
    styles.highlight('Usage examples:') +
    `\n\n${styles.command('banana create-project my-app')}` +
    `\n${styles.command('banana create-project my-app --yarn')}` +
    `\n${styles.command('banana create-project my-app --git')}`,
    {
      padding: 1,
      borderColor: 'yellow',
      margin: 1
    }
  )
);

// ========================
    // COMMAND: CREATE APP
    // ========================
    program
    .command('create-app <app-name>')
    .description('Create a new application')
    .option('-t, --template <template>', 'Template to use (react|vue|docs|firebase)', 'react')
    .option('--git', 'Initialize git repository', false)
    .option('--yarn', 'Use yarn instead of npm', false)
    .action(async (appName, options) => {
      showBanner();

      try {
        // Create workspace directory if it doesn't exist
        const workspaceDir = path.join(process.cwd(), 'workspace');
        await fs.ensureDir(workspaceDir);

        const result = await createApp(appName, options.template, {
          git: options.git,
          packageManager: options.yarn ? 'yarn' : 'npm',
          parentPath: workspaceDir // Pass workspace as parent directory
        });

        // Calculate the path of the created app relative to the current working directory (process.cwd()).
        // Since the app is created inside 'workspace', this relative path will automatically include 'workspace/'.
        // Example: if process.cwd() is /home/user/project and result.appDir is /home/user/project/workspace/my-app,
        // relativePath will be 'workspace/my-app'.
        const relativePath = path.relative(process.cwd(), result.appDir);

        // Show the relative path in the success message.
        // We use relativePath directly as it already contains the 'workspace/' prefix.
        console.log(styles.success(`\n✔ Success! Created: ${relativePath || `workspace/${appName}`}`));

        console.log(
          boxen(
            styles.highlight('Next steps:') +
            // Use relativePath directly for the cd command as it's the path relative to the current directory.
            `\n\n${styles.command(`cd ${relativePath || `workspace/${appName}`}`)}\n` +
            `${styles.command(`${options.yarn ? 'yarn' : 'npm'} install`)}\n` +
            `${styles.command(`${options.yarn ? 'yarn' : 'npm'} run dev`)}`,
            { padding: 1, borderColor: 'green' }
          )
        );
      } catch (err) {
        console.error(styles.error('\n✖ Creation failed:'), err.message);
        process.exit(1);
      }
    });


    // ========================
    // COMMAND: DEV
    // ========================
    program
      .command('dev')
      .description('Start development server with hot reload')
      .option('-p, --port <port>', 'Port to run on', '5000')
      .option('--open', 'Open browser automatically', false)
      .option('--host <host>', 'Host to bind to (e.g., 0.0.0.0 for network access)', 'localhost')
      .action((options) => {
        try {
          showBanner();
          const startTime = Date.now();
          console.log(primaryGradient('\n⚡ Starting development server...\n'));

          const currentDir = process.cwd();
          console.log(styles.highlight(`🔎 Working Directory: ${currentDir}`));

          const publicDir = path.join(currentDir, 'public');
          const srcDir = path.join(currentDir, 'src');

          if (!fs.existsSync(publicDir)) {
            console.error(styles.error(`✖ Public directory not found at expected path: ${publicDir}`));
            console.error(styles.error(`  Please ensure a 'public' directory exists in your project.`));
            process.exit(1);
          }

          let srcDirExists = fs.existsSync(srcDir);
          if (!srcDirExists) {
            console.warn(styles.warning(`⚠️ Source directory not found at expected path: ${srcDir}`));
            console.warn(styles.warning(`  HMR for source files might not work.`));
          } else {
            console.log(styles.highlight(`🔧 Source files directory: ${srcDir}`));
          }
          console.log(styles.highlight(`📂 Public assets directory: ${publicDir}`));

          const serverPath = path.resolve(__dirname, 'server.cjs');
          if (!fs.existsSync(serverPath)) {
            console.error(styles.error(`✖ Critical Error: Server script not found at ${serverPath}`));
            process.exit(1);
          }

          const env = {
            ...process.env,
            NODE_ENV: 'development',
            PORT: options.port,
            HOST: options.host,
            PROJECT_ROOT: currentDir,
            PUBLIC_DIR: publicDir,
            SRC_DIR: srcDirExists ? srcDir : '',
            OPEN_BROWSER: options.open ? 'true' : 'false'
          };

          console.log(styles.highlight(`🚀 Spawning server process: node ${path.relative(currentDir, serverPath)}`));
          console.log(styles.highlight(`   Environment: NODE_ENV=${env.NODE_ENV}, PORT=${env.PORT}, HOST=${env.HOST}`));
          console.log(styles.highlight(`   PROJECT_ROOT=${env.PROJECT_ROOT}`));
          console.log(styles.highlight(`   PUBLIC_DIR=${env.PUBLIC_DIR}`));
          console.log(styles.highlight(`   SRC_DIR=${env.SRC_DIR || 'N/A'}`));

          const serverProcess = spawn('node', [serverPath], {
            stdio: 'inherit',
            env
          });

          serverProcess.on('error', (err) => {
            console.error(styles.error('✖ Failed to start server process:'), err);
            process.exit(1);
          });

          serverProcess.on('close', (code) => {
            if (code === 0) {
              const endTime = Date.now();
              console.log(styles.success(`\n✔ Server ready in ${endTime - startTime}ms`));
              console.log(
                boxen(
                  styles.highlight('Development server running:') +
                  `\n\n${styles.command(`Local:   http://localhost:${options.port}/`)}` +
                  `\n${styles.command(`Network: http://${options.host}:${options.port}/`)}` +
                  `\n\n${styles.option('Press h + enter for help menu')}`,
                  { padding: 1, borderColor: 'blue' }
                )
              );
            } else if (code !== null) {
              console.error(styles.error(`\n✖ Server process exited unexpectedly with code ${code}`));
            } else {
              console.log(chalk.gray(`\nServer process finished (Code: ${code}).`));
            }
          });
        } catch (err) {
          console.error(styles.error('✖ Failed to initiate development server startup:'), err);
          process.exit(1);
        }
      })
      .addHelpText('after',
        boxen(
          styles.highlight('Development Server Options:') +
          `\n\n${styles.command('banana dev')} ${styles.option('# Basic development server')}` +
          `\n${styles.command('banana dev --port 3000')} ${styles.option('# Custom port')}` +
          `\n${styles.command('banana dev --open')} ${styles.option('# Auto-open browser')}` +
          `\n${styles.command('banana dev --host 0.0.0.0')} ${styles.option('# Expose to local network')}` +
          `\n\n${styles.highlight('Features:')}` +
          `\n- Hot module replacement (if src/ exists)` +
          `\n- Live reload` +
          `\n- Serves content from public/`,
          { padding: 1, borderColor: 'cyan' }
        )
      );

    // ========================
    // COMMAND: START
    // ========================
    program
      .command('start')
      .description('Start production server (serves dist)')
      .option('-p, --port <port>', 'Port to run on', '4200')
      .option('--host <host>', 'Host to bind to (e.g., 0.0.0.0 for network access)', 'localhost')
      .action(async (options) => {
        try {
          showBanner();
          const startTime = Date.now();
          console.log(primaryGradient('\n🚀 Launching production server...\n'));

          const currentDir = process.cwd();
          console.log(styles.highlight(`🔎 Working Directory: ${currentDir}`));

          // Check for production assets
          const distDir = path.join(currentDir, 'dist');
          const publicDir = path.join(currentDir, 'index.html');
          let serveDir = '';

          if (fs.existsSync(distDir)) {
            serveDir = distDir;
            console.log(styles.highlight(`📦 Found production build in: ${distDir}`));
            
            // Ensure CSS exists in dist
            if (!fs.existsSync(path.join(distDir, 'styles/banana.css'))) {
              console.log(styles.warning(`⚠️  CSS file not found in dist, copying from public...`));
              await fs.ensureDir(path.join(distDir, 'styles'));
              if (fs.existsSync(path.join(publicDir, 'styles/banana.css'))) {
                await fs.copy(
                  path.join(publicDir, '/styles/banana.css'),
                  path.join(distDir, '/styles/banana.css')
                );
              }
            }
          } else if (fs.existsSync(publicDir)) {
            serveDir = publicDir;
            console.log(styles.highlight(`📂 Serving fallback public directory: ${publicDir}`));
            console.log(styles.warning(`   (Recommended: Run 'banana build' first for production)`));
          } else {
            console.error(styles.error(`✖ Cannot start server: Neither 'dist' nor 'public' directory found`));
            process.exit(1);
          }

          console.log(styles.highlight(`📂 Serving content from: ${serveDir}`));

          // Verify critical files exist
          const requiredFiles = [
            'index.html',
            '/styles/banana.css',
            '/main.js'
          ];
          
          for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(serveDir, file))) {
              console.error(styles.error(`✖ Required file missing: ${file}`));
              process.exit(1);
            }
          }

          const serverPath = path.resolve(__dirname, 'server.cjs');
          const env = {
            ...process.env,
            NODE_ENV: 'production',
            PORT: options.port,
            HOST: options.host,
            PROJECT_ROOT: currentDir,
            PUBLIC_DIR: serveDir,
            ASSETS_BASE_URL: '/',
          };

          console.log(styles.highlight(`🚀 Starting server on port ${options.port}`));
          
          const serverProcess = spawn('node', [serverPath], {
            stdio: 'inherit',
            env
          });

          serverProcess.on('error', (err) => {
            console.error(styles.error('✖ Server error:'), err);
            process.exit(1);
          });

          serverProcess.on('close', (code) => {
            if (code === 0) {
              console.log(styles.success(`\n✔ Server ready in ${Date.now() - startTime}ms`));
              console.log(
                boxen(
                  styles.highlight('Server Running:') +
                  `\n\n${styles.command(`Local:   http://localhost:${options.port}`)}` +
                  `\n${styles.command(`Network: http://${options.host === '0.0.0.0' ? getLocalIp() : options.host}:${options.port}`)}` +
                  `\n\n${styles.option('Press CTRL+C to stop')}`,
                  { padding: 1, borderColor: 'green' }
                )
              );
            } else {
              console.error(styles.error(`✖ Server exited with code ${code}`));
            }
          });

          // Helper to get local IP
          function getLocalIp() {
            const interfaces = os.networkInterfaces();
            for (const name of Object.keys(interfaces)) {
              for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                  return iface.address;
                }
              }
            }
            return 'localhost';
          }

        } catch (err) {
          console.error(styles.error('✖ Server startup failed:'), err);
          process.exit(1);
        }
      });

    // ========================
    // COMMAND: BUILD
    // ========================
    program
      .command('build')
      .description('Compile project for production')
      .option('--css', 'Build only CSS assets')
      .option('--analyze', 'Generate bundle analysis')
      .option('--no-clean', 'Skip cleaning dist folder')
      .action(async (options) => {
        showBanner();
        console.log(styles.highlight('\n🚀 Building production bundle...'));

        const runCommand = async (cmd, args, options = {}) => {
          const proc = spawn(cmd, args, { 
            stdio: 'inherit', 
            shell: true,
            ...options 
          });
          return new Promise((resolve, reject) => {
            proc.on('close', (code) => 
              code === 0 ? resolve() : reject(new Error(`Command failed with code ${code}`))
            );
          });
        };

        try {
          // 1. CLEAN PHASE
          if (options.clean !== false) {
            console.log(styles.highlight('\n🧹 Cleaning previous build...'));
            if (fs.existsSync('dist')) {
              await fs.remove('dist');
              console.log(styles.warning('• Removed dist directory'));
            }
            // Clear Tailwind cache
            const tailwindCache = path.join(os.tmpdir(), 'tailwind');
            if (fs.existsSync(tailwindCache)) {
              await fs.remove(tailwindCache);
              console.log(styles.warning('• Cleared Tailwind cache'));
            }
          }

          // 2. BUILD PHASE
          await fs.ensureDir('dist');

          if (options.css) {
            // CSS-only build
            console.log(styles.highlight('\n🎨 Building CSS...'));
            await runCommand('npx', [
              'tailwindcss',
              'build', 'src/styles/main.css',
              '-o', 'dist/styles/banana.css',
              '--minify'
            ]);
          } else {
            // Full build
            // 2A. Build CSS
            console.log(styles.highlight('\n🎨 Processing CSS...'));
            await runCommand('npx', [
              'tailwindcss',
              'build', 'src/styles/main.css',
              '-o', 'dist/styles/banana.css',
              '--minify'
            ]);

            // 2B. Build JS
            console.log(styles.highlight('\n📦 Bundling JavaScript...'));
            const { build } = await import('esbuild');
            await build({
              entryPoints: ['./src/main.js'],
              bundle: true,
              outfile: 'dist/main.js',
              minify: true,
              sourcemap: true,
              platform: 'browser',
              define: {
                'process.env.NODE_ENV': '"production"'
              },
              loader: {
                '.js': 'jsx',
                '.jsx': 'jsx',
                '.png': 'file',
                '.svg': 'file',
                '.jpg': 'file'
              },
              plugins: [
                (await import('esbuild-style-plugin')).default({
                  postcss: {
                    plugins: [
                      (await import('tailwindcss')).default,
                      (await import('autoprefixer')).default
                    ]
                  }
                })
              ]
            });

           // 2C. Process HTML
            console.log(styles.highlight('\n📄 Processing HTML...'));
            if (!fs.existsSync('public/index.html')) {
              throw new Error('HTML template not found at public/index.html');
            }

            let htmlContent = await fs.readFile('public/index.html', 'utf-8');

            // Robust path replacement with regex
            htmlContent = htmlContent
              .replace(/(<script[^>]*src=["'])(\.\/)?(main\.js)(["'][^>]*>)/g, '$1/$3$4')
              .replace(/(<link[^>]*href=["'])(\.\/)?(banana\.css)(["'][^>]*>)/g, '$1/styles/$3$4')
              .replace(/(<base[^>]*href=["'])(\.\/)?(["'])/g, '$1/$3');

            // Verify replacements were made
            if (!htmlContent.includes('/main.js')) {
              console.warn(styles.warning('⚠  main.js path not updated in HTML'));
            }
            if (!htmlContent.includes('/styles/banana.css')) {
              console.warn(styles.warning('⚠  banana.css path not updated in HTML'));
            }

            await fs.writeFile('dist/index.html', htmlContent);
            
            // 2D. Copy static assets
            if (fs.existsSync('public')) {
              console.log(styles.highlight('\n🖼️  Copying public assets...'));
              await fs.copy('public', 'dist');
            }

            // Bundle analysis if requested
            if (options.analyze) {
              console.log(styles.highlight('\n📊 Generating bundle analysis...'));
              await runCommand('npx', ['source-map-explorer', 'dist/main.js*']);
            }
          }

          console.log(styles.success('\n✔ Build complete!'));
          console.log(
            boxen(
              `${styles.highlight('Output Files:')}\n` +
              `${styles.file('• dist/index.html')}\n` +
              `${styles.file('• dist/main.js')}\n` +
              `${styles.file('• dist/styles/banana.css')}\n\n` +
              `${styles.command('banana serve')} ${styles.option('# Test locally')}\n` +
              `${styles.command('banana start')} ${styles.option('# Run production server')}`,
              { padding: 1, borderColor: 'green' }
            )
          );

        } catch (err) {
          console.error(styles.error('\n✖ Build failed:'), err.message);
          process.exit(1);
        }
      });

    // ========================
    // COMMAND: SERVE
    // ========================
    program
      .command('serve')
      .description('Serve a directory locally (uses `npx serve`)')
      .option('-p, --port <port>', 'Port to serve on', '5000')
      .option('--dir <directory>', 'Directory to serve (default: dist/ or public/)', '')
      .action(async (options) => {
        try {
          showBanner();

          const currentDir = process.cwd();
          let serveDir = options.dir ? path.resolve(currentDir, options.dir) : '';

          if (!serveDir) {
              const distDir = path.join(currentDir, 'dist');
              const publicDir = path.join(currentDir, 'public');
              if (fs.existsSync(distDir)) {
                  serveDir = distDir;
              } else if (fs.existsSync(publicDir)) {
                  serveDir = publicDir;
              } else {
                  console.error(styles.error(`✖ Cannot serve: Neither 'dist/' nor 'public/' directory found in ${currentDir}.`));
                  console.error(styles.error(`  Specify a directory with --dir or run 'banana build'.`));
                  process.exit(1);
              }
          }

          if (!fs.existsSync(serveDir)) {
            console.error(styles.error(`✖ Directory to serve not found: "${serveDir}"`));
            process.exit(1);
          }

          const relativeServeDir = path.relative(currentDir, serveDir);
          const serveCommand = 'npx';
          const serveArgs = ['serve', serveDir, '-l', options.port];

          console.log(primaryGradient(`\n🌐 Serving ${styles.highlight(relativeServeDir)} using '${serveCommand} serve' on port ${options.port}...\n`));

          const serveProcess = spawn(serveCommand, serveArgs, {
            stdio: 'inherit',
            shell: true
          });

          serveProcess.on('error', (err) => {
            console.error(styles.error(`✖ Failed to start '${serveCommand} serve':`), err);
            console.error(styles.error(`  Ensure you have Node.js and npm/npx installed and in your PATH.`));
            process.exit(1);
          });

          serveProcess.on('close', (code) => {
            if (code !== 0 && code !== null) {
              console.error(styles.error(`✖ Serve process exited unexpectedly with code ${code}`));
            } else {
                console.log(chalk.gray(`\nServe process finished (Code: ${code}).`));
            }
          });

        } catch (err) {
          console.error(styles.error('✖ Unexpected error during serve command:'), err);
          process.exit(1);
        }
      })
      .addHelpText('after',
        boxen(
          styles.highlight('Examples:') +
          `\n\n${styles.command('banana serve')} ${styles.option('# Serve dist/ or public/')}` +
          `\n${styles.command('banana serve --port 3000')} ${styles.option('# Custom port')}` +
          `\n${styles.command('banana serve --dir ./build')} ${styles.option('# Specific directory')}` +
          `\n\n${styles.highlight('Note:')} Uses ${styles.command('npx serve')}. No local installation needed.`,
          { padding: 1, borderColor: 'blue' }
        )
      );

    // Show help if no command provided or unknown command
    program.on('command:*', (operands) => {
        console.error(styles.error(`Invalid command: ${operands[0]}\n`));
        program.help();
        process.exit(1);
    });

    if (process.argv.length < 3) {
      showBanner();
      program.help();
    } else {
       program.parse(process.argv);
    }

  } catch (err) {
    console.error('❌ CLI Initialization Error:', err.message);
    process.exit(1);
  }
})();