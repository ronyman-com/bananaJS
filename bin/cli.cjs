#!/usr/bin/env node

// CommonJS requires (for non-ESM packages)
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const handler = require('serve-handler'); // Used only by 'serve' potentially
const http = require('http'); // Not directly used by CLI commands
const os = require('os'); // Added for networkInterfaces

// Load version and createApp synchronously
let version = '0.0.0'; // Default version
let createApp = async () => { throw new Error('createApp module not loaded'); }; // Default function

try {
    version = require(path.join(__dirname, '..', 'lib', 'cli-version.cjs')).version;
} catch (e) {
    console.warn("⚠️ Could not load version info.");
}
try {
    createApp = require(path.resolve(__dirname, '../lib/create-app.cjs'));
} catch (e) {
    console.warn("⚠️ Could not load createApp module.");
}


// Async wrapper for ESM imports
(async () => {
  let chalk, gradient, figlet, boxen;
  try {
    // Dynamic imports for ESM packages
    chalk = (await import('chalk')).default;
    gradient = (await import('gradient-string')).default;
    figlet = (await import('figlet')).default;
    boxen = (await import('boxen')).default;

    // Configure colors and styles
    const primaryColor = gradient('cyan', 'violet');
    const secondaryColor = gradient('pink', 'orange');
    const errorStyle = chalk.bold.red;
    const successStyle = chalk.bold.green;
    const highlightStyle = chalk.bold.cyan;
    const commandStyle = chalk.bold.yellow;
    const optionStyle = chalk.italic.gray;
    const warnStyle = chalk.yellow;

    // Create banner
    const showBanner = () => {
      console.log(
        boxen(
          primaryColor(
            figlet.textSync('BananaJS', {
              horizontalLayout: 'full',
              font: 'ANSI Shadow' // Consider 'Standard' or others if this font isn't available everywhere
            })
          ) +
          `\n${secondaryColor('A modern JavaScript framework toolkit')}\n` +
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

    // Helper function to find project root (looking for banana.config.js/cjs or package.json)
    function findProjectRoot(startPath) {
      let current = path.resolve(startPath);
      const rootPath = path.parse(current).root;
      while (current !== rootPath) {
        if (fs.existsSync(path.join(current, 'banana.config.js')) ||
            fs.existsSync(path.join(current, 'banana.config.cjs')) ||
            fs.existsSync(path.join(current, 'package.json'))) {
          return current;
        }
        const parent = path.dirname(current);
         if (parent === current) break; // Prevent infinite loop at root
        current = parent;
      }
      return startPath; // Fall back to starting directory if no indicator found
    }

    // Helper function to get local IP address
    function getLocalIpAddress() {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        const ifaceArr = interfaces[name];
        if (ifaceArr) { // Check if array exists
            for (const iface of ifaceArr) {
                if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
                }
            }
        }
      }
      return 'localhost'; // Fallback
    }


    // ========================
    // PROGRAM SETUP
    // ========================
    program
      .name('banana')
      .version(version, '-v, --version', 'Display version')
      .usage('[command] [options]')
      .description(
        boxen(
          highlightStyle('BananaJS CLI - Project Management\n\n') +
          'Usage:\n  ' + commandStyle('banana [command] [options]\n\n') +
          'Example:\n  ' + commandStyle('banana create my-app --template react\n  ') +
          commandStyle('banana dev'),
          { padding: 1, borderColor: 'blue' }
        )
      )
      .addHelpText('after',
        boxen(
          highlightStyle('Command Categories:\n') +
          '\n' + primaryColor('🏗️   Project Setup:') +
          '\n  banana create-project       Initialize new project' +
          '\n  banana create-app           Create new App (defaults to react)' +
          '\n  banana create-app <name> --vue    Create new App with Vue template' +
          '\n  banana create-app <name> --react  Create new App with React Template' +
          '\n  banana create-app <name> --docs   Create new App with Docs Template' +
          '\n\n' + primaryColor('🚀 Development:') +
          '\n  banana dev                  Start development server' +
          '\n  banana start                Start production server' +
          '\n\n' + primaryColor('📦 Build & Deploy:') +
          '\n  banana build                Compile project for production' +
          // '\n  banana build --css          Build only CSS assets' + // Keep commented if build script doesn't support it yet
          '\n  banana serve                Serve production build locally' +
          '\n\n' + highlightStyle('Run ') + commandStyle('banana [command] --help') +
          highlightStyle(' for detailed usage'),
          { padding: 1, borderColor: 'magenta' }
        )
      );

    // ========================
    // COMMAND: CREATE PROJECT
    // ========================
    program
      .command('create-project <project-name>')
      .description('Initialize a new BananaJS project')
      .option('-t, --template <template>', 'Project template (react|vue|docs)', 'react')
      .option('--yarn', 'Use yarn instead of npm')
      .action((projectName, options) => {
        showBanner();
        console.log(primaryColor('\n🚀 Launching project creation...\n'));

        const projectDir = path.join(process.cwd(), projectName);
        const template = options.template.toLowerCase();
        const packageManager = options.yarn ? 'yarn' : 'npm';

        if (fs.existsSync(projectDir)) {
          console.error(errorStyle(`✖ Project "${projectName}" already exists.`));
          process.exit(1);
        }

        // Assuming templates are relative to the bin directory structure
        const templateDir = path.resolve(__dirname, '..', 'templates', template);
        if (!fs.existsSync(templateDir)) {
          console.error(errorStyle(`✖ Template directory not found at: ${templateDir}`));
          console.error(errorStyle(`  (Looking for template: "${template}")`));
          process.exit(1);
        }

        console.log(highlightStyle(`⚙️  Creating ${template} project in ${projectDir}...`));
        try {
            fs.copySync(templateDir, projectDir);
        } catch (copyError) {
            console.error(errorStyle(`✖ Failed to copy template files:`), copyError);
            process.exit(1);
        }


        console.log(successStyle('\n✔ Project created successfully!\n'));
        console.log(boxen(
          highlightStyle('Next steps:') +
          `\n\n${commandStyle(`cd ${projectName}`)}` +
          `\n${commandStyle(`${packageManager} install`)}` +
          `\n${commandStyle(`${packageManager} run dev`)}`,
          { padding: 1, borderColor: 'green' }
        ));
      })
      .addHelpText('after',
        boxen(
          highlightStyle('Examples:') +
          `\n\n${commandStyle('banana create-project my-app')}` +
          `\n${commandStyle('banana create-project my-app --template vue')}` +
          `\n${commandStyle('banana create-project my-app --yarn')}`,
          { padding: 1, borderColor: 'yellow' }
        )
      );

    // ========================
    // COMMAND: CREATE APP
    // ========================
    program
      .command('create-app <app-name>')
      .description('Create a new application within the current project')
      .option('--react', 'Use React template (default)')
      .option('--vue', 'Use Vue template')
      .option('--docs', 'Use Docs template')
      .action(async (appName, options) => {
        showBanner();
        console.log(primaryColor('\n✨ Creating new application...\n'));
        try {
          console.log('📋 Received options:', options);

          let template = 'react'; // Default
          if (options.vue) {
            template = 'vue';
            console.log('🖖 Using Vue template');
          } else if (options.docs) {
            template = 'docs';
            console.log('📚 Using Docs template');
          } else {
             console.log('⚛️  Using React template (default)');
          }

          if (typeof createApp !== 'function') {
              throw new Error('createApp module is not loaded correctly.');
          }

          const result = await createApp(appName, template);

          if (!result || typeof result.appDir !== 'string') {
              console.error(errorStyle('✖ Invalid response received from createApp module. Expected { appDir: "path" }.'));
              console.error('Received:', result);
              process.exit(1);
          }
          const { appDir } = result;
          const relativeAppDir = path.relative(process.cwd(), appDir);

          console.log(successStyle(`\n✔ Successfully created ${template} app at:`));
          console.log(highlightStyle(`  ${relativeAppDir}`));
          console.log('\n🎉 Done! Happy coding!');

        } catch (err) {
          console.error(errorStyle(`✖ Error creating application:`), err.message);
          console.error(errorStyle(err.stack || ''));
          console.error('\n💡 Tip: Check file permissions and ensure the app name is valid.');
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
      .option('--host <host>', 'Host to bind to (e.g., 0.0.0.0 for network access)', 'localhost') // Allow specifying host
      .action((options) => {
        try {
          showBanner();
          const startTime = Date.now();
          console.log(primaryColor('\n⚡ Starting development server...\n'));

          const currentDir = process.cwd();
          console.log(highlightStyle(`🔎 Working Directory: ${currentDir}`));

          const publicDir = path.join(currentDir, 'public');
          const srcDir = path.join(currentDir, 'src');

          if (!fs.existsSync(publicDir)) {
            console.error(errorStyle(`✖ Public directory not found at expected path: ${publicDir}`));
            console.error(errorStyle(`  Please ensure a 'public' directory exists in your project.`));
            process.exit(1);
          }
          let srcDirExists = fs.existsSync(srcDir);
          if (!srcDirExists) {
            console.warn(warnStyle(`⚠️ Source directory not found at expected path: ${srcDir}`));
            console.warn(warnStyle(`  HMR for source files might not work.`));
          } else {
             console.log(highlightStyle(`🔧 Source files directory: ${srcDir}`));
          }
          console.log(highlightStyle(`📂 Public assets directory: ${publicDir}`));


          const serverPath = path.resolve(__dirname, 'server.cjs');
          if (!fs.existsSync(serverPath)) {
              console.error(errorStyle(`✖ Critical Error: Server script not found at ${serverPath}`));
              process.exit(1);
          }

          const env = {
            ...process.env,
            NODE_ENV: 'development',
            PORT: options.port,
            HOST: options.host,
            PROJECT_ROOT: currentDir,
            PUBLIC_DIR: publicDir,
            SRC_DIR: srcDirExists ? srcDir : '', // Pass empty string if src doesn't exist
            OPEN_BROWSER: options.open ? 'true' : 'false'
          };

          console.log(highlightStyle(`🚀 Spawning server process: node ${path.relative(currentDir, serverPath)}`));
          console.log(highlightStyle(`   Environment: NODE_ENV=${env.NODE_ENV}, PORT=${env.PORT}, HOST=${env.HOST}`));
          console.log(highlightStyle(`   PROJECT_ROOT=${env.PROJECT_ROOT}`));
          console.log(highlightStyle(`   PUBLIC_DIR=${env.PUBLIC_DIR}`));
          console.log(highlightStyle(`   SRC_DIR=${env.SRC_DIR || 'N/A'}`));


          const serverProcess = spawn('node', [serverPath], {
            stdio: 'inherit',
            env
          });

          serverProcess.on('error', (err) => {
            console.error(errorStyle('✖ Failed to start server process:'), err);
            process.exit(1);
          });

          serverProcess.on('close', (code) => {
            if (code !== 0 && code !== null) {
              console.error(errorStyle(`\n✖ Server process exited unexpectedly with code ${code}`));
              // Don't exit CLI here, let user see server errors
            } else {
               console.log(chalk.gray(`\nServer process finished (Code: ${code}).`));
            }
          });

        } catch (err) {
          console.error(errorStyle('✖ Failed to initiate development server startup:'), err);
          process.exit(1);
        }
      })
      .addHelpText('after',
        boxen(
          highlightStyle('Development Server Options:') +
          `\n\n${commandStyle('banana dev')} ${optionStyle('# Basic development server')}` +
          `\n${commandStyle('banana dev --port 3000')} ${optionStyle('# Custom port')}` +
          `\n${commandStyle('banana dev --open')} ${optionStyle('# Auto-open browser')}` +
          `\n${commandStyle('banana dev --host 0.0.0.0')} ${optionStyle('# Expose to local network')}` +
          `\n\n${highlightStyle('Features:')}` +
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
      .description('Start production server (serves dist/ or public/)')
      .option('-p, --port <port>', 'Port to run on', '4200')
      .option('--host <host>', 'Host to bind to (e.g., 0.0.0.0 for network access)', 'localhost')
      .action((options) => {
        try {
          showBanner();
          const startTime = Date.now();
          console.log(primaryColor('\n🚀 Launching production server...\n'));

          const currentDir = process.cwd();
          console.log(highlightStyle(`🔎 Working Directory: ${currentDir}`));

          const distDir = path.join(currentDir, 'dist');
          const publicDir = path.join(currentDir, 'public');
          let serveDir = '';

          if (fs.existsSync(distDir)) {
            serveDir = distDir;
            console.log(highlightStyle(`📦 Found production build in: ${distDir}`));
          } else if (fs.existsSync(publicDir)) {
            serveDir = publicDir;
             console.log(highlightStyle(`📂 Serving fallback public directory: ${publicDir}`));
             console.log(warnStyle(`   (Recommended: Run 'banana build' first for production)`));
          } else {
            console.error(errorStyle(`✖ Cannot start server: Neither 'dist' nor 'public' directory found in ${currentDir}`));
            console.error(errorStyle(`  Please run 'banana build' or ensure a 'public' directory exists.`));
            process.exit(1);
          }

          console.log(highlightStyle(`📂 Serving content from: ${serveDir}`));

          const serverPath = path.resolve(__dirname, 'server.cjs');
           if (!fs.existsSync(serverPath)) {
              console.error(errorStyle(`✖ Critical Error: Server script not found at ${serverPath}`));
              process.exit(1);
          }

          const env = {
            ...process.env,
            NODE_ENV: 'production',
            PORT: options.port,
            HOST: options.host,
            PROJECT_ROOT: currentDir,
            PUBLIC_DIR: serveDir,
            // SRC_DIR is not needed for production
          };

          console.log(highlightStyle(`🚀 Spawning server process: node ${path.relative(currentDir, serverPath)}`));
          console.log(highlightStyle(`   Environment: NODE_ENV=${env.NODE_ENV}, PORT=${env.PORT}, HOST=${env.HOST}`));
          console.log(highlightStyle(`   PROJECT_ROOT=${env.PROJECT_ROOT}`));
          console.log(highlightStyle(`   PUBLIC_DIR=${env.PUBLIC_DIR}`));


          const serverProcess = spawn('node', [serverPath], {
            stdio: 'inherit',
            env
          });

          serverProcess.on('error', (err) => {
            console.error(errorStyle('✖ Failed to start server process:'), err);
            process.exit(1);
          });

          serverProcess.on('close', (code) => {
             if (code !== 0 && code !== null) {
              console.error(errorStyle(`\n✖ Server process exited unexpectedly with code ${code}`));
            } else {
               console.log(chalk.gray(`\nServer process finished (Code: ${code}).`));
            }
          });

        } catch (err) {
          console.error(errorStyle('✖ Failed to initiate production server startup:'), err);
          process.exit(1);
        }
      })
      .addHelpText('after',
        boxen(
          highlightStyle('Production Server Options:') +
          `\n\n${commandStyle('banana start')} ${optionStyle('# Basic production server')}` +
          `\n${commandStyle('banana start --port 3000')} ${optionStyle('# Custom port')}` +
          `\n${commandStyle('banana start --host 0.0.0.0')} ${optionStyle('# Expose to local network')}` +
          `\n\n${highlightStyle('Features:')}` +
          `\n- Serves from ${commandStyle('dist/')} if available` +
          `\n- Falls back to ${commandStyle('public/')}` +
          `\n- Optimized for production`,
          { padding: 1, borderColor: 'magenta' }
        )
      );


    // ========================
    // COMMAND: BUILD
    // ========================
    program
      .command('build')
      .description('Compile project for production using build script')
      // Add specific build options here if needed, e.g., --analyze
      // .option('--analyze', 'Generate bundle analysis')
      .action(async (options) => {
        showBanner();
        console.log(primaryColor('\n🔨 Building project for production...\n'));

        const buildScriptPath = path.resolve(__dirname, 'build.cjs'); // Path to your build script

        if (!fs.existsSync(buildScriptPath)) {
            console.error(errorStyle(`✖ Build script not found at: ${buildScriptPath}`));
            console.error(errorStyle(`  Please ensure 'build.cjs' exists in the 'bin' directory.`));
            process.exit(1);
        }

        console.log(highlightStyle(`🚀 Executing build script: node ${path.relative(process.cwd(), buildScriptPath)}`));

        // Prepare environment for the build script (e.g., pass options)
        const buildEnv = {
            ...process.env,
            NODE_ENV: 'production', // Ensure build runs in production mode
            // Pass other options if the build script uses them
            // ANALYZE_BUNDLE: options.analyze ? 'true' : 'false',
        };

        const buildProcess = spawn('node', [buildScriptPath], {
            stdio: 'inherit', // Show build output directly
            env: buildEnv,
            cwd: process.cwd() // Ensure build runs in the correct project directory
        });

        buildProcess.on('error', (err) => {
            console.error(errorStyle('✖ Failed to start build process:'), err);
            process.exit(1);
        });

        buildProcess.on('close', (code) => {
            if (code === 0) {
                console.log(successStyle('\n✔ Build process completed successfully!'));
                // You can add next steps guidance here if needed
                console.log(boxen(
                    highlightStyle('Next steps:') +
                    `\n\n${commandStyle('banana serve')} ${optionStyle('# Test production build locally')}` +
                    `\n${commandStyle('banana start')} ${optionStyle('# Run production server')}`,
                    { padding: 1, borderColor: 'green' }
                ));
            } else {
                console.error(errorStyle(`\n✖ Build process failed with exit code ${code}`));
                process.exit(code); // Exit CLI with the build's error code
            }
        });
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
                  console.error(errorStyle(`✖ Cannot serve: Neither 'dist/' nor 'public/' directory found in ${currentDir}.`));
                  console.error(errorStyle(`  Specify a directory with --dir or run 'banana build'.`));
                  process.exit(1);
              }
          }

          if (!fs.existsSync(serveDir)) {
            console.error(errorStyle(`✖ Directory to serve not found: "${serveDir}"`));
            process.exit(1);
          }

          const relativeServeDir = path.relative(currentDir, serveDir);
          const serveCommand = 'npx';
          // Ensure directory path with spaces is handled correctly if needed (though unlikely for dist/public)
          const serveArgs = ['serve', serveDir, '-l', options.port];

          console.log(primaryColor(`\n🌐 Serving ${highlightStyle(relativeServeDir)} using '${serveCommand} serve' on port ${options.port}...\n`));

          const serveProcess = spawn(serveCommand, serveArgs, {
            stdio: 'inherit',
            shell: true // Often needed for npx, especially on Windows
          });

          serveProcess.on('error', (err) => {
            console.error(errorStyle(`✖ Failed to start '${serveCommand} serve':`), err);
            console.error(errorStyle(`  Ensure you have Node.js and npm/npx installed and in your PATH.`));
            process.exit(1);
          });

          serveProcess.on('close', (code) => {
            if (code !== 0 && code !== null) {
              console.error(errorStyle(`✖ Serve process exited unexpectedly with code ${code}`));
            } else {
                console.log(chalk.gray(`\nServe process finished (Code: ${code}).`));
            }
          });

        } catch (err) {
          console.error(errorStyle('✖ Unexpected error during serve command:'), err);
          process.exit(1);
        }
      })
      .addHelpText('after',
        boxen(
          highlightStyle('Examples:') +
          `\n\n${commandStyle('banana serve')} ${optionStyle('# Serve dist/ or public/')}` +
          `\n${commandStyle('banana serve --port 3000')} ${optionStyle('# Custom port')}` +
          `\n${commandStyle('banana serve --dir ./build')} ${optionStyle('# Specific directory')}` +
          `\n\n${highlightStyle('Note:')} Uses ${commandStyle('npx serve')}. No local installation needed.`,
          { padding: 1, borderColor: 'blue' }
        )
      );

    // Show help if no command provided or unknown command
    program.on('command:*', (operands) => {
        console.error(errorStyle(`Invalid command: ${operands[0]}\n`));
        program.help();
        process.exit(1);
    });

    if (process.argv.length < 3) {
      showBanner();
      program.help();
    } else {
       // Parse arguments
       program.parse(process.argv);
    }


  } catch (err) {
    // Catch errors during async setup (imports, etc.)
    // Ensure chalk is loaded before using errorStyle
    const errorStyle = chalk ? chalk.bold.red : (text) => text; // Fallback if chalk failed
    console.error(errorStyle('❌ CLI Initialization Error:'), err.message);
    console.error(err.stack || '');
    process.exit(1);
  }
})(); // Immediately invoke the async function
