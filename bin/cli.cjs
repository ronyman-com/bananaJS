#!/usr/bin/env node

// CommonJS requires (for non-ESM packages)
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const handler = require('serve-handler');
const http = require('http');
 
const { version } = require(path.join(__dirname, '..', 'lib', 'cli-version.cjs'));
const createApp = require(path.resolve(__dirname, '../lib/create-app.cjs'));


// Async wrapper for ESM imports
(async () => {
  // Dynamic imports for ESM packages
  const { default: chalk } = await import('chalk');
  const { default: gradient } = await import('gradient-string');
  const { default: figlet } = await import('figlet');
  const { default: boxen } = await import('boxen');

  // Configure colors and styles
  const primaryColor = gradient('cyan', 'violet');
  const secondaryColor = gradient('pink', 'orange');
  const errorStyle = chalk.bold.red;
  const successStyle = chalk.bold.green;
  const highlightStyle = chalk.bold.cyan;
  const commandStyle = chalk.bold.yellow;
  const optionStyle = chalk.italic.gray;

  // Create banner
  const showBanner = () => {
    console.log(
      boxen(
        primaryColor(
          figlet.textSync('BananaJS', {
            horizontalLayout: 'full',
            font: 'ANSI Shadow'
          })
        ) + 
        `\n${secondaryColor('A modern JavaScript framework toolkit')}\n` +
        chalk.gray(`Version ${program.version()}`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan'
        }
      )
    );
  };

// Configure server
const server = http.createServer((request, response) => {
  return handler(request, response);
});



// ========================
// CATEGORY: PROJECT SETUP
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
      '\n  banana create-app           Create new App' +
      '\n  banana create-app appname --vue    Create new App with Vue template' +
      '\n  banana create-app appname --react  Create new App with React Template' +
      '\n  banana create-app appname --docs  Create new App with Docs Template' +
      '\n\n' + primaryColor('🚀 Development:') +
      '\n  banana dev          Start development server' +
      '\n  banana start        Start production server' +
      '\n\n' + primaryColor('📦 Build & Deploy:') +
      '\n  banana build        Compile for production' +
      '\n  banana build --css  Build only CSS assets' +
      '\n  banana serve        Serve production build' +
      '\n\n' + highlightStyle('Run ') + commandStyle('banana [command] --help') + 
      highlightStyle(' for detailed usage'),
      { padding: 1, borderColor: 'magenta' }
    )
  );

// ========================
// COMMAND: CREATE
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

    const templateDir = path.join(__dirname, `templates/${template}`);
    if (!fs.existsSync(templateDir)) {
      console.error(errorStyle(`✖ Template "${template}" not available.`));
      process.exit(1);
    }

    console.log(highlightStyle(`⚙️  Creating ${template} project in ${projectDir}...`));
    fs.copySync(templateDir, projectDir);

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
      `\n\n${commandStyle('banana create my-app')}` +
      `\n${commandStyle('banana create my-app --template vue')}` +
      `\n${commandStyle('banana create my-app --yarn')}`,
      { padding: 1, borderColor: 'yellow' }
    )
  );


// ========================
// COMMAND: CREATE APP
// ========================
program
  .command('create-app <app-name>')
  .description('Create a new application')
  .option('--react', 'Use React template', true)
  .option('--vue', 'Use Vue template', true)
  .option('--docs', 'Use Docs template', true)
  .action(async (appName, options) => {
    try {
      // Debug output
      console.log('📋 Received options:', options);
      
      // Determine template (priority: react > vue > docs)
      let template;
      if (options.react) {
        template = 'react';
        console.log('⚛️  Using React template');
      } else if (options.vue) {
        template = 'vue';
        console.log('🖖 Using Vue template');
      } else {
        template = 'docs';
        console.log('📚 Using Docs template');
      }

      const { appDir } = await createApp(appName, template);
      
      console.log(`✨ Successfully created ${template} app at:`);
      console.log(`📂 ${appDir}`);
      console.log('🎉 Done! Happy coding!');
      
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      console.error('💡 Tip: Check your permissions and try again');
      process.exit(1);
    }
  });

// ========================
// CATEGORY: DEVELOPMENT
// ========================

// COMMAND: DEV
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run on', '5000')
  .option('--open', 'Open browser automatically', false)
  .action((options) => {
    showBanner();
    const startTime = Date.now();
    console.log(primaryColor('\n⚡ Starting development server...\n'));

    const serverPath = path.join(__dirname, 'server.cjs');
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      PORT: options.port,
      OPEN_BROWSER: options.open ? 'true' : 'false'
    };

    const serverProcess = spawn('node', [serverPath], { 
      stdio: 'inherit',
      env 
    });

    serverProcess.on('error', (err) => {
      console.error(errorStyle('✖ Failed to start server:'), err);
      process.exit(1);
    });

    serverProcess.on('close', (code) => {
      if (code === 0) {
        const endTime = Date.now();
        console.log(successStyle(`\n✔ Server ready in ${endTime - startTime}ms`));
        console.log(boxen(
          highlightStyle('Development server running:') +
          `\n\n${commandStyle(`Local:   http://localhost:${options.port}/`)}` +
          `\n${commandStyle('Network: use --host to expose')}` +
          `\n\n${optionStyle('Press h + enter for help menu')}`,
          { padding: 1, borderColor: 'blue' }
        ));
      } else {
        console.error(errorStyle(`✖ Server crashed with code ${code}`));
        process.exit(code);
      }
    });
  });

// COMMAND: START
program
  .command('start')
  .description('Start production server')
  .option('-p, --port <port>', 'Port to run on', '4200')
  .action((options) => {
    showBanner();
    const startTime = Date.now();
    console.log(primaryColor('\n🚀 Launching production server...\n'));

    const serverPath = path.join(__dirname, 'server.cjs');
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: options.port
    };

    const serverProcess = spawn('node', [serverPath], {
      stdio: 'inherit',
      env
    });

    serverProcess.on('error', (err) => {
      console.error(errorStyle('✖ Failed to start server:'), err);
      process.exit(1);
    });

    serverProcess.on('close', (code) => {
      if (code === 0) {
        console.log(successStyle(`\n✔ Production server ready in ${Date.now() - startTime}ms`));
        console.log(boxen(
          highlightStyle('Production server running:') +
          `\n\n${commandStyle(`Listening on port ${options.port}`)}` +
          `\n\n${optionStyle('Press CTRL+C to stop')}`,
          { padding: 1, borderColor: 'green' }
        ));
      } else {
        console.error(errorStyle(`✖ Server crashed with code ${code}`));
        process.exit(code);
      }
    });
  });

// ========================
// CATEGORY: BUILD & DEPLOY
// ========================

// COMMAND: BUILD
program
  .command('build')
  .description('Compile project for production')
  .option('--css', 'Build only CSS assets')
  .option('--analyze', 'Generate bundle analysis')
  .action(async (options) => {
    showBanner();
    console.log(primaryColor('\n🔨 Building project for production...\n'));

    if (options.css) {
      console.log(highlightStyle('⚙️  Processing CSS assets...'));
      try {
        const tailwindBin = path.join(__dirname, 'node_modules', '.bin', 'tailwindcss');
        const isWindows = process.platform === 'win32';
        const tailwindCommand = isWindows ? `${tailwindBin}.cmd` : tailwindBin;
        
        const tailwindProcess = spawn(tailwindCommand, [
          'build',
          'public/styles/main.css',
          '-o',
          'public/styles/banana.css'
        ], { 
          stdio: 'inherit',
          shell: isWindows
        });

        tailwindProcess.on('close', (code) => {
          if (code === 0) {
            console.log(successStyle('\n✔ CSS compiled successfully!'));
          } else {
            console.error(errorStyle(`✖ CSS compilation failed (code ${code})`));
            process.exit(code);
          }
        });
      } catch (err) {
        console.error(errorStyle('✖ CSS compilation error:'), err);
        process.exit(1);
      }
    } else {
      const buildPath = path.join(__dirname, 'build.cjs');
      const env = {
        ...process.env,
        ANALYZE_BUNDLE: options.analyze ? 'true' : 'false'
      };

      const buildProcess = spawn('node', [buildPath], { 
        stdio: 'inherit',
        env
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log(successStyle('\n✔ Production build complete!'));
          console.log(boxen(
            highlightStyle('Next steps:') +
            `\n\n${commandStyle('banana serve')} ${optionStyle('# Test production build')}` +
            `\n${commandStyle('banana start')} ${optionStyle('# Run production server')}`,
            { padding: 1, borderColor: 'green' }
          ));
        } else {
          console.error(errorStyle(`✖ Build failed (code ${code})`));
          process.exit(code);
        }
      });
    }
  });

// COMMAND: SERVE
program
  .command('serve')
  .description('Serve production build locally')
  .option('-p, --port <port>', 'Port to serve on', '5000')
  .option('--dir <directory>', 'Directory to serve', 'dist')
  .action(async (options) => {
    try {
      // Show banner if available
      if (typeof showBanner === 'function') {
        showBanner();
      }

      // Enhanced console output
      const serveMessage = `🌐 Serving ${options.dir} on port ${options.port}...`;
      if (typeof primaryColor === 'function') {
        console.log(primaryColor(`\n${serveMessage}\n`));
      } else {
        console.log('\n' + serveMessage + '\n');
      }

      // Verify directory exists
      if (!fs.existsSync(options.dir)) {
        const errorMsg = `Directory "${options.dir}" not found`;
        if (typeof errorStyle === 'function') {
          console.error(errorStyle(`✖ ${errorMsg}`));
        } else {
          console.error(errorMsg);
        }
        process.exit(1);
      }

      // Improved serve process with fallback options
      const serveArgs = [
        'serve',
        options.dir,
        '-l',
        options.port
      ];

      // Try both npx and local serve binary
      let serveProcess;
      try {
        // First try direct execution (works if serve is installed locally)
        serveProcess = spawn('serve', serveArgs.slice(1), {
          stdio: 'inherit',
          shell: true
        });
      } catch (npxError) {
        console.log('Falling back to npx...');
        serveProcess = spawn('npx', serveArgs, {
          stdio: 'inherit',
          shell: true
        });
      }

      // Error handling
      serveProcess.on('error', (err) => {
        const errorMsg = 'Failed to start server:';
        if (typeof errorStyle === 'function') {
          console.error(errorStyle(`✖ ${errorMsg}`), err);
        } else {
          console.error(errorMsg, err);
        }
        
        console.log('\nTry installing serve first:');
        console.log(commandStyle('npm install -g serve'));
        process.exit(1);
      });

      serveProcess.on('close', (code) => {
        if (code !== 0) {
          const errorMsg = `Server exited with code ${code}`;
          if (typeof errorStyle === 'function') {
            console.error(errorStyle(`✖ ${errorMsg}`));
          } else {
            console.error(errorMsg);
          }
          process.exit(code);
        }
      });

    } catch (err) {
      const errorMsg = 'Unexpected error:';
      if (typeof errorStyle === 'function') {
        console.error(errorStyle(`✖ ${errorMsg}`), err);
      } else {
        console.error(errorMsg, err);
      }
      process.exit(1);
    }
  })
  .addHelpText('after', `
Examples:
  ${commandStyle('banana serve')}
  ${commandStyle('banana serve --port 5000 --dir public')}

Note: Requires 'serve' package. Install with:
  ${commandStyle('npm install -g serve')}
`);

// Show help if no command provided
if (process.argv.length < 3) {
  showBanner();
  program.help();
}



// 1. FIXED PATHS - NEVER CHANGE
const BIN_DIR = path.dirname(fs.realpathSync(__filename));
const PROJECT_ROOT = path.resolve(BIN_DIR, '..');

// 2. COMMAND RESOLUTION
function resolveCommand() {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';
  
  // Map commands to their respective handlers
  const commands = {
    build: () => require('./build.cjs'),
    serve: () => require('./server.cjs'),
    // Add other commands as needed
  };

  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Available commands:', Object.keys(commands).join(', '));
    process.exit(1);
  }

  return commands[command]();
}

// 3. EXECUTE WITH ERROR HANDLING
try {
  resolveCommand();
} catch (err) {
  console.error('❌ CLI Error:', err.message);
  console.error('BIN_DIR:', BIN_DIR);
  console.error('PROJECT_ROOT:', PROJECT_ROOT);
  process.exit(1);
}

///



program.parse(process.argv);
})();