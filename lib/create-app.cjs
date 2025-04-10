const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);




// 1. PATH NORMALIZATION (For Windows/OneDrive)
const normalizePath = (inputPath) => {
  return path.normalize(inputPath).replace(/^\/?[A-Z]:\\/i, '');
};

// 2. FRAMEWORK DETECTION
const detectFramework = async (projectPath = process.cwd()) => {
  const normalizedPath = normalizePath(projectPath);
  
  try {
    // Check package.json first
    const pkgPath = path.join(normalizedPath, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.vue) return 'vue';
      if (deps.react) return 'react';
    }

    // Fallback to file detection
    const [hasVue, hasReact] = await Promise.all([
      fs.pathExists(path.join(normalizedPath, 'src/App.vue')),
      fs.pathExists(path.join(normalizedPath, 'src/App.jsx'))
    ]);

    return hasVue ? 'vue' : hasReact ? 'react' : 'react'; // Default
  } catch (err) {
    console.error('Framework detection error:', err);
    return 'react'; // Fallback
  }
};

// 3. VERSION MANAGEMENT
const versionCache = new Map();
const getLatestVersion = async (pkg = '@ronyman/bananajs') => {
  if (versionCache.has(pkg)) return versionCache.get(pkg);
  
  try {
    const { stdout } = await exec(`npm view ${pkg} version`, { timeout: 2000 });
    const version = `^${stdout.trim()}`;
    versionCache.set(pkg, version);
    return version;
  } catch (err) {
    console.warn('Version check failed, using fallback');
    return '^0.1.0'; // Fallback
  }
};


// 4. TEMPLATE PROCESSOR
const processTemplate = async (src, dest, context) => {
  let content = await fs.readFile(src, 'utf8');
  
  const replacements = {
    '{{app-name}}': context.appName.toLowerCase().replace(/\s+/g, '-'),
    '{{banana-version}}': await getLatestVersion(),
    '{{framework}}': context.framework,
    '{{timestamp}}': new Date().toISOString()
  };

  Object.entries(replacements).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value);
  });

  await fs.outputFile(dest, content);
};

// 5. MAIN CREATE APP FUNCTION
module.exports = async function createApp(appName, template, options = {}) {
  // Input validation
  if (!appName || !/^[a-z0-9-]+$/i.test(appName)) {
    throw new Error('Invalid app name (letters, numbers, hyphens only)');
  }

  // Normalize paths
  const rootDir = normalizePath(options.cwd || process.cwd());
  const appDir = path.join(process.cwd(), appName);
  const templateDir = path.join(__dirname, '../templates', template.toLowerCase());

  // Verify template exists
  if (!await fs.pathExists(templateDir)) {
    const available = await fs.readdir(path.join(__dirname, '../templates'));
    throw new Error(`Template "${template}" not found. Available: ${available.join(', ')}`);
  }

// And modify the success output to show just the folder name:
console.log(`✅ Banana Successfully created ${template} app for ${appName} in /MyApp`);



  try {
    // Create directory structure
    await fs.ensureDir(appDir);
    const files = await fs.readdir(templateDir);

    // Process files with progress tracking
    await Promise.all(files.map(async (file) => {
      const src = path.join(templateDir, file);
      const dest = path.join(appDir, file);
      const stats = await fs.stat(src);

      if (stats.isDirectory()) {
        await fs.copy(src, dest);
      } else {
        const ext = path.extname(file);
        if (['.js', '.jsx', '.vue', '.json', '.html'].includes(ext)) {
          await processTemplate(src, dest, { appName, framework: template });
        } else {
          await fs.copy(src, dest);
        }
      }
    }));

    // Framework-specific setup
    if (template === 'vue') {
      await fs.ensureDir(path.join(appDir, 'src/components'));
    } else {
      await fs.ensureDir(path.join(appDir, 'src/components'));
    }

    // Initialize Git repo if requested
    if (options.git) {
      try {
        await exec('git init', { cwd: appDir });
        console.log('Initialized Git repository');
      } catch (gitError) {
        console.warn('Git initialization failed:', gitError.message);
      }
    }

    return {
      appDir,
      template,
      framework: template,
      success: true
    };

  } catch (err) {
    // Cleanup on failure
    if (await fs.pathExists(appDir)) {
      await fs.remove(appDir).catch(() => {});
    }
    throw err;
  }
};

// Export utilities
module.exports.detectFramework = detectFramework;
module.exports.getLatestVersion = getLatestVersion;