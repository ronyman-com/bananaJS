#!/usr/bin/env node

// CommonJS requires (for non-ESM packages)
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const handler = require('serve-handler'); // Used only by 'serve' potentially
const http = require('http'); // Not directly used by CLI commands
const os = require('os'); // Added for networkInterfaces

//const createApp  = require(path.resolve(__dirname, '..', 'lib','create-app.cjs'));
//const { createApp } = require('../lib/create-app.cjs');
//const createApp = require('../lib/create-app'); // Adjusted path
// With this more robust version:
// Load version and createApp synchronously
const { version } = require(path.join(__dirname, '..', 'lib', 'cli-version.cjs'));


// Replace all createApp loading attempts with this single robust version:
const createAppPath = path.resolve(__dirname, '../lib/create-app.cjs');
console.log('Loading createApp from:', createAppPath);

if (!fs.existsSync(createAppPath)) {
  throw new Error(`Critical Error: create-app.cjs not found at ${createAppPath}`);
}


// Add this debug code BEFORE trying to load createApp
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Resolved create-app path:', path.resolve(__dirname, '../lib/create-app.cjs'));
console.log('File exists:', fs.existsSync(path.resolve(__dirname, '../lib/create-app.cjs')));

// Then use this robust loading approach:
let createApp;
try {
  const createAppPath = path.resolve(__dirname, '../lib/create-app.cjs');
  
  // Clear any cached version
  delete require.cache[require.resolve(createAppPath)];
  
  // Load module
  const createAppModule = require(createAppPath);
  
  // Validate exports
  if (typeof createAppModule?.createApp === 'function') {
    createApp = createAppModule.createApp;
  } else if (typeof createAppModule === 'function') {
    createApp = createAppModule;
  } else {
    throw new Error('Module does not export a valid createApp function');
  }
  
  console.log('Successfully loaded createApp function');
} catch (err) {
  console.error('Failed to load createApp:', err);
  console.error('Error details:', {
    code: err.code,
    path: err.path,
    stack: err.stack
  });
  process.exit(1);
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
// PROGRAM SETUP (Using Commander's styling)
// ========================
program
  .name('banana')
  .version(version, '-v, --version', `Display version (current: ${version})`)
  .description('BananaJS CLI - The sweetest way to build web apps')
  .usage('[command] [options]')
  .addHelpText('before', 
    boxen(
      // Using Commander's built-in styling
      '\x1b[38;5;208mBananaJS CLI - Project Management\x1b[0m\n\n' +  // Orange
      'Usage:\n  \x1b[36mbanana [command] [options]\x1b[0m\n\n' +      // Cyan
      'Examples:\n' + 
      '  \x1b[36mbanana create my-app --react\x1b[0m   # Create React app\n' +
      '  \x1b[36mbanana dev --port 4000\x1b[0m        # Start dev server\n' +
      '  \x1b[36mbanana build --analyze\x1b[0m        # Build with analysis',
      { padding: 1, borderColor: 'blue', margin: 1 }
    )
  )
  .addHelpText('after', 
    boxen(
      '\x1b[38;5;208mCommand Categories:\x1b[0m\n' +
      '\n\x1b[34m🏗️  Project Creation:\x1b[0m' +
      '\n  banana create-project   Create new project' +
      '\n  banana create-app --template rect   Create new React app' +
      '\n  banana create-app --template vue   Create new Vue app' +
      '\n  banana dev to start development server' +
      '\n  init                  Alias for create' +
      '\n\n\x1b[34m🚀 Development:\x1b[0m' +
      '\n  dev [--port]          Start dev server (default: 3000)' +
      '\n  test [--watch]        Run tests' +
      '\n\n\x1b[34m📦 Build & Deploy:\x1b[0m' +
      '\n  build [--analyze]     Production build with analysis' +
      '\n  deploy [--env]        Deploy to specified environment' +
      '\n\n\x1b[34m🛠️  Configuration:\x1b[0m' +
      '\n  config                Manage project configuration' +
      '\n\n\x1b[38;5;208mRun \x1b[36mbanana <command> --help\x1b[38;5;208m for detailed usage\x1b[0m' +
      '\n\n\x1b[33mNeed help? https://bananajs.dev/docs\x1b[0m',
      { padding: 1, borderColor: 'magenta', margin: 1 }
    )
  )
  .showHelpAfterError('(add --help for additional information)')
  .option('--verbose', 'Show detailed output', false)
  .option('--debug', 'Show debug information', false);


// ========================
// COMMAND: CREATE PROJECT (COMBINED BEST VERSION)
// ========================
program
.command('create-project <project-name>')
.description('Initialize a new BananaJS project with default template')
.option('--yarn', 'Use yarn instead of npm', false)
.option('--git', 'Initialize git repository', false)
.action(async (projectName, options) => {
  showBanner();
  console.log(primaryColor('\n🚀 Creating new BananaJS project...\n'));

  // Validate project name (browser-safe)
  if (!/^[a-z0-9-]+$/i.test(projectName)) {
    console.error(errorStyle('✖ Invalid project name (only letters, numbers, and hyphens allowed)'));
    if (typeof window !== 'undefined') {
      throw new Error('Invalid project name');
    }
    process.exit(1);
  }

  // Path resolution (browser-safe)
  const getProjectDir = () => {
    if (typeof window !== 'undefined') {
      return projectName; // Browser environment
    }
    // Node environment - use corrected template path from first version
    return path.join(process.cwd(), projectName);
  };

  const projectDir = getProjectDir();
  const packageManager = options.yarn ? 'yarn' : 'npm';
  
  // Template directory resolution (using corrected path from first version)
  const getTemplateDir = () => {
    if (typeof window !== 'undefined') {
      return '/api/Projects/templates/default'; // Browser API endpoint
    }
    // Node environment - use the corrected path from first version
    return path.resolve(__dirname, '../Projects/templates/default');
  };

  const templateDir = getTemplateDir();

  try {
    // Check if project exists (Node-only)
    if (typeof window === 'undefined' && fs.existsSync(projectDir)) {
      throw new Error(`Directory "${projectName}" already exists`);
    }

    // Verify template exists (Node-only)
    if (typeof window === 'undefined' && !fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found at: ${templateDir}\n` +
                    `Please ensure the default template exists in Projects/templates/default`);
    }

    console.log(highlightStyle(`Setting up project: ${projectName}`));
    console.log(highlightStyle(`Using package manager: ${packageManager}`));

    if (typeof window === 'undefined') {
      // Node.js filesystem operations
      await fs.ensureDir(projectDir);
      await fs.copy(templateDir, projectDir);

      // Process template files with enhanced replacements from first version
      const processTemplateFile = async (filePath) => {
        if (fs.existsSync(filePath)) {
          let content = await fs.readFile(filePath, 'utf8');
          
          content = content
            .replace(/{{project-name}}/g, projectName.toLowerCase().replace(/\s+/g, '-'))
            .replace(/{{banana-version}}/g, await getLatestBananaVersion())
            .replace(/{{timestamp}}/g, new Date().toISOString());

          await fs.writeFile(filePath, content);
        }
      };

      // Process package.json and other template files
      await processTemplateFile(path.join(projectDir, 'package.json'));
      
      // Additional files to process from second version
      const templateFilesToProcess = [
        'README.md',
        'src/config.js',
        'vite.config.js'
      ];
      
      await Promise.all(
        templateFilesToProcess.map(file => 
          processTemplateFile(path.join(projectDir, file))
            .catch(() => {}) // Silently fail if file doesn't exist
        )
      );

      // Git initialization (Node-only)
      if (options.git) {
        try {
          await exec('git init', { cwd: projectDir });
          console.log(successStyle('✓ Initialized Git repository'));
        } catch (gitError) {
          console.warn(warnStyle('⚠ Could not initialize Git:'), gitError.message);
        }
      }
    } else {
      // Browser-specific file generation
      try {
        const response = await fetch('/api/create-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectName,
            useYarn: options.yarn,
            initGit: options.git
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create project');
        }

        const result = await response.json();
        console.log(successStyle('\n✔ Project files generated!'));
        
        // Create download link for the generated project
        const zipBlob = await fetch(result.downloadUrl).then(r => r.blob());
        const url = URL.createObjectURL(zipBlob);
        
        displayBrowserDownload(
          `Project "${projectName}" is ready to download!`,
          projectName,
          url
        );
      } catch (err) {
        console.error(errorStyle('\n✖ Project creation failed:'), err.message);
        throw err;
      }
    }

    // Success message (enhanced from both versions)
    console.log(successStyle('\n✔ Project ready!'));
    console.log(boxen(
      highlightStyle('Next steps:') +
      `\n\n${commandStyle(`cd ${projectName}`)}` +
      `\n${commandStyle(`${packageManager} install`)}` +
      `\n${commandStyle(`${packageManager} run dev`)}`,
      { 
        padding: 1,
        borderColor: 'green',
        margin: 1
      }
    ));

  } catch (err) {
    console.error(errorStyle('\n✖ Project creation failed:'), err.message);
    
    // Clean up (Node-only)
    if (typeof window === 'undefined' && fs.existsSync(projectDir)) {
      await fs.remove(projectDir).catch(() => {});
    }
    
    if (typeof window !== 'undefined') {
      throw err; // Re-throw for browser error handling
    }
    process.exit(1);
  }
})
.addHelpText('after',
  boxen(
    highlightStyle('Usage examples:') +
    `\n\n${commandStyle('banana create-project my-app')}` +
    `\n${commandStyle('banana create-project my-app --yarn')}` +
    `\n${commandStyle('banana create-project my-app --git')}`,
    {
      padding: 1,
      borderColor: 'yellow',
      margin: 1
    }
  )
);

// Enhanced helper function to get latest banana version (combining both approaches)
async function getLatestBananaVersion() {
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/banana-version');
      if (!response.ok) throw new Error('Version check failed');
      const data = await response.json();
      return `^${data.version}`;
    } else {
      const { stdout } = await exec('npm view @ronyman/bananajs version');
      return `^${stdout.trim()}`;
    }
  } catch (err) {
    console.warn(warnStyle('⚠ Could not fetch latest version, using fallback'));
    return '^0.1.0'; // Fallback version
  }
}

// Browser-specific helper functions (from second version)
async function displayBrowserDownload(message, projectName, downloadUrl) {
  const downloadArea = document.getElementById('download-area') || createDownloadArea();
  downloadArea.innerHTML = `
    <div class="download-container">
      <h3>${message}</h3>
      <a href="${downloadUrl}" download="${projectName}.zip" class="download-btn">
        Download ${projectName}.zip
      </a>
    </div>
  `;
}

function createDownloadArea() {
  const div = document.createElement('div');
  div.id = 'download-area';
  div.style.position = 'fixed';
  div.style.bottom = '20px';
  div.style.right = '20px';
  div.style.padding = '15px';
  div.style.background = '#f8f9fa';
  div.style.borderRadius = '8px';
  div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  div.style.zIndex = '1000';
  document.body.appendChild(div);
  return div;
}


// Initialize with safe default
let createProject = async () => {
  throw new Error('createProject module not loaded - using fallback function');
};

// Try to load create-project.cjs with proper error handling
try {
  // Resolve the absolute path to the module
  const createProjectPath = path.resolve(__dirname, '../lib/create-project.cjs');
  console.debug(`Attempting to load createProject from: ${createProjectPath}`);

  // Verify the file exists before requiring
  if (!fs.existsSync(createProjectPath)) {
    throw new Error(`File not found at ${createProjectPath}`);
  }

  // Load the module
  const createProjectModule = require(createProjectPath);
  
  // Validate the export
  if (typeof createProjectModule?.createProject === 'function') {
    createProject = createProjectModule.createProject;
    console.debug('Successfully loaded createProject function from module exports');
  } else if (typeof createProjectModule === 'function') {
    createProject = createProjectModule;
    console.debug('Successfully loaded createProject as default export');
  } else {
    throw new Error('Module does not export a valid createProject function');
  }
  
} catch (e) {
  console.error('⚠️ Failed to load createProject module:', e.message);
  
  // Enhanced fallback function with better error reporting
  const originalCreateProject = createProject;
  createProject = async (projectName, options = {}) => {
    console.error('CREATE PROJECT FAILED - MODULE NOT LOADED');
    console.error('Project Name:', projectName);
    console.error('Options:', options);
    
    const errorDetails = [
      'Cannot create project - required module not loaded',
      `Original error: ${e.message}`,
      `Expected module path: ${path.resolve(__dirname, '../lib/create-project.cjs')}`,
      'Please ensure:',
      '1. The file exists in the lib directory',
      '2. The file exports a createProject function',
      '3. The file is valid CommonJS (.cjs)'
    ].join('\n');
    
    throw new Error(errorDetails);
  };
}

// Export either the loaded function or fallback
module.exports = {
  createProject,
  // Export the loading status for debugging
  getModuleStatus: () => ({
    loaded: createProject.name !== 'createProject' // Check if still the fallback
  })
};

// Initialize with safe defaults/////////////////////////////
// Initialize with safe default
let createApp = async () => {
  throw new Error('createApp module not loaded - using fallback function');
};

// Try to load create-app.cjs with proper error handling
try {
  // Explicitly use .cjs extension for CommonJS
  const createAppPath = path.resolve(__dirname, '../lib/create-app.cjs');
  console.debug(`Loading createApp from: ${createAppPath}`);
  
  // Load the module
  const createAppModule = require(createAppPath);
  
  // Validate the export
  if (typeof createAppModule?.createApp === 'function') {
    createApp = createAppModule.createApp;
  } else if (typeof createAppModule === 'function') {
    createApp = createAppModule;
  } else {
    throw new Error('Module does not export a valid createApp function');
  }
  
  console.debug('Successfully loaded createApp function');
} catch (e) {
  console.warn('⚠️ Could not load createApp module:', e.message);
  
  // Enhanced fallback function
  createApp = async (...args) => {
    console.error('CREATE APP FAILED - MODULE NOT LOADED');
    console.error('Attempted arguments:', args);
    throw new Error(
      `Cannot create app - required module not loaded\n` +
      `Original error: ${e.message}\n` +
      `Please ensure lib/create-app.cjs exists and exports a createApp function`
    );
  };
}
/////////////////////////////////////////////////////////////
// Updated create-app command handler
program
  .command('create-app <app-name>')
  .description('Create a new application')
  .option('-t, --template <template>', 'Template to use (react|vue|docs)', 'react')
  .option('--git', 'Initialize git repository', false)
  .option('--yarn', 'Use yarn instead of npm', false)
  .action(async (appName, options) => {
    showBanner();
    
    try {
      const result = await createApp(appName, options.template, {
        git: options.git,
        packageManager: options.yarn ? 'yarn' : 'npm'
      });
  
      // Show relative path in success message
      const relativePath = path.relative(process.cwd(), result.appDir);
      console.log(successStyle(`\n✔ Success! Created : ${relativePath || '' + appName}`));
      
      // ... rest of your success output ...
    } catch (err) {
      console.error(errorStyle('\n✖ Creation failed:'), err.message);
      process.exit(1);
    }
  })


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
      SRC_DIR: srcDirExists ? srcDir : '',
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
      if (code === 0) {
        const endTime = Date.now();
        console.log(successStyle(`\n✔ Server ready in ${endTime - startTime}ms`));
        console.log(boxen(
          highlightStyle('Development server running:') +
          `\n\n${commandStyle(`Local:   http://localhost:${options.port}/`)}` +
          `\n${commandStyle(`Network: http://${options.host}:${options.port}/`)}` +
          `\n\n${optionStyle('Press h + enter for help menu')}`,
          { padding: 1, borderColor: 'blue' }
        ));
      } else if (code !== null) {
        console.error(errorStyle(`\n✖ Server process exited unexpectedly with code ${code}`));
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
.description('Start production server (serves dist)')
.option('-p, --port <port>', 'Port to run on', '4200')
.option('--host <host>', 'Host to bind to (e.g., 0.0.0.0 for network access)', 'localhost')
.action(async (options) => {
  try {
    showBanner();
    const startTime = Date.now();
    console.log(primaryColor('\n🚀 Launching production server...\n'));

    const currentDir = process.cwd();
    console.log(highlightStyle(`🔎 Working Directory: ${currentDir}`));

    // Check for production assets
    const distDir = path.join(currentDir, 'dist');
    const publicDir = path.join(currentDir, 'index.html');
    let serveDir = '';

    if (fs.existsSync(distDir)) {
      serveDir = distDir;
      console.log(highlightStyle(`📦 Found production build in: ${distDir}`));
      
      // Ensure CSS exists in dist
      if (!fs.existsSync(path.join(distDir, 'styles/banana.css'))) {
        console.log(warnStyle(`⚠️  CSS file not found in dist, copying from public...`));
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
      console.log(highlightStyle(`📂 Serving fallback public directory: ${publicDir}`));
      console.log(warnStyle(`   (Recommended: Run 'banana build' first for production)`));
    } else {
      console.error(errorStyle(`✖ Cannot start server: Neither 'dist' nor 'public' directory found`));
      process.exit(1);
    }

    console.log(highlightStyle(`📂 Serving content from: ${serveDir}`));

    // Verify critical files exist
    const requiredFiles = [
      'index.html',
      '/styles/banana.css',
      '/main.js'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(serveDir, file))) {
        console.error(errorStyle(`✖ Required file missing: ${file}`));
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
      // Ensure correct paths for static assets
      ASSETS_BASE_URL: '/',
    };

    console.log(highlightStyle(`🚀 Starting server on port ${options.port}`));
    
    const serverProcess = spawn('node', [serverPath], {
      stdio: 'inherit',
      env
    });

    serverProcess.on('error', (err) => {
      console.error(errorStyle('✖ Server error:'), err);
      process.exit(1);
    });

    serverProcess.on('close', (code) => {
      if (code === 0) {
        console.log(successStyle(`\n✔ Server ready in ${Date.now() - startTime}ms`));
        console.log(boxen(
          highlightStyle('Server Running:') +
          `\n\n${commandStyle(`Local:   http://localhost:${options.port}`)}` +
          `\n${commandStyle(`Network: http://${options.host === '0.0.0.0' ? getLocalIp() : options.host}:${options.port}`)}` +
          `\n\n${optionStyle('Press CTRL+C to stop')}`,
          { padding: 1, borderColor: 'green' }
        ));
      } else {
        console.error(errorStyle(`✖ Server exited with code ${code}`));
      }
    });

    // Helper to get local IP
    function getLocalIp() {
      const interfaces = require('os').networkInterfaces();
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
    console.error(errorStyle('✖ Server startup failed:'), err);
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
    // Style definitions (could also move to separate file)
    const highlightStyle = (text) => chalk.cyanBright.bold(text);
    const successStyle = (text) => chalk.greenBright.bold(text);
    const errorStyle = (text) => chalk.redBright.bold(text);
    const warningStyle = (text) => chalk.yellowBright(text);
    const commandStyle = (text) => chalk.yellowBright(text);
    const optionStyle = (text) => chalk.gray.italic(text);
    const fileStyle = (text) => chalk.blueBright(text);

    showBanner();
    console.log(highlightStyle('\n🚀 Building production bundle...'));

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
        console.log(highlightStyle('\n🧹 Cleaning previous build...'));
        if (fs.existsSync('dist')) {
          await fs.remove('dist');
          console.log(warningStyle('• Removed dist directory'));
        }
        // Clear Tailwind cache
        const tailwindCache = path.join(os.tmpdir(), 'tailwind');
        if (fs.existsSync(tailwindCache)) {
          await fs.remove(tailwindCache);
          console.log(warningStyle('• Cleared Tailwind cache'));
        }
      }

      // 2. BUILD PHASE
      await fs.ensureDir('dist');

      if (options.css) {
        // CSS-only build
        console.log(highlightStyle('\n🎨 Building CSS...'));
        await runCommand('npx', [
          'tailwindcss',
          'build', 'src/styles/main.css',
          '-o', 'dist/styles/banana.css',
          '--minify'
        ]);
      } else {
        // Full build
        // 2A. Build CSS
        console.log(highlightStyle('\n🎨 Processing CSS...'));
        await runCommand('npx', [
          'tailwindcss',
          'build', 'src/styles/main.css',
          '-o', 'dist/styles/banana.css',
          '--minify'
        ]);

        // 2B. Build JS
        console.log(highlightStyle('\n📦 Bundling JavaScript...'));
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
        console.log(highlightStyle('\n📄 Processing HTML...'));
        if (!fs.existsSync('public/index.html')) {
          throw new Error('HTML template not found at public/index.html');
        }

        let htmlContent = await fs.readFile('public/index.html', 'utf-8');

        // Robust path replacement with regex
        htmlContent = htmlContent
          // Handle JS paths (various formats)
          .replace(/(<script[^>]*src=["'])(\.\/)?(main\.js)(["'][^>]*>)/g, '$1/$3$4')
          // Handle CSS paths (various formats)
          .replace(/(<link[^>]*href=["'])(\.\/)?(banana\.css)(["'][^>]*>)/g, '$1/styles/$3$4')
          // Update base href if exists
          .replace(/(<base[^>]*href=["'])(\.\/)?(["'])/g, '$1/$3');

        // Verify replacements were made
        if (!htmlContent.includes('/main.js')) {
          console.warn(warningStyle('⚠  main.js path not updated in HTML'));
        }
        if (!htmlContent.includes('/styles/banana.css')) {
          console.warn(warningStyle('⚠  banana.css path not updated in HTML'));
        }

        await fs.writeFile('dist/index.html', htmlContent);
        
        // 2D. Copy static assets
        if (fs.existsSync('public')) {
          console.log(highlightStyle('\n🖼️  Copying public assets...'));
          await fs.copy('public', 'dist');
        }

        // Bundle analysis if requested
        if (options.analyze) {
          console.log(highlightStyle('\n📊 Generating bundle analysis...'));
          await runCommand('npx', ['source-map-explorer', 'dist/main.js*']);
        }
      }

      console.log(successStyle('\n✔ Build complete!'));
      console.log(boxen(
        `${highlightStyle('Output Files:')}\n` +
        `${fileStyle('• dist/index.html')}\n` +
        `${fileStyle('• dist/main.js')}\n` +
        `${fileStyle('• dist/styles/banana.css')}\n\n` +
        `${commandStyle('banana serve')} ${optionStyle('# Test locally')}\n` +
        `${commandStyle('banana start')} ${optionStyle('# Run production server')}`,
        { padding: 1, borderColor: 'green' }
      ));

    } catch (err) {
      console.error(errorStyle('\n✖ Build failed:'), err.message);
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
