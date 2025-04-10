const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// 1. PATH NORMALIZATION (For Windows/OneDrive)
const normalizePath = (inputPath) => {
  return path.normalize(inputPath);
};

// 2. VERSION MANAGEMENT
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

// 3. TEMPLATE PROCESSOR
const processTemplate = async (filePath, context) => {
  let content = await fs.readFile(filePath, 'utf8');
  
  const replacements = {
    '{{project-name}}': context.projectName.toLowerCase().replace(/\s+/g, '-'),
    '{{banana-version}}': await getLatestVersion(),
    '{{timestamp}}': new Date().toISOString()
  };

  Object.entries(replacements).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value);
  });

  await fs.writeFile(filePath, content);
};

// 4. MAIN CREATE PROJECT FUNCTION
module.exports = async function createProject(projectName, options = {}) {
  // Input validation
  if (!projectName || !/^[a-z0-9-]+$/i.test(projectName)) {
    throw new Error('Invalid project name (letters, numbers, hyphens only)');
  }

  // Path setup - directly in current working directory
  const projectDir = path.join(process.cwd(), projectName);
  const templateDir = path.join(__dirname, '../Projects/templates');

  // Verify template exists
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Default template not found at: ${templateDir}`);
  }

  console.log(`Creating project '${projectName}' in ./${projectName}`);

  try {
    // Create project directory
    await fs.ensureDir(projectDir);

    // Copy template files
    const files = await fs.readdir(templateDir);
    await Promise.all(files.map(async (file) => {
      const src = path.join(templateDir, file);
      const dest = path.join(projectDir, file);
      
      if ((await fs.stat(src)).isDirectory()) {
        await fs.copy(src, dest);
      } else {
        await fs.copy(src, dest);
        // Process template files immediately after copying
        if (file === 'package.json') {
          await processTemplate(dest, { projectName });
        }
      }
    }));

    // Initialize Git repo if requested
    if (options.git) {
      try {
        await exec('git init', { cwd: projectDir });
        console.log('✓ Initialized Git repository');
      } catch (gitError) {
        console.warn('⚠ Could not initialize Git:', gitError.message);
      }
    }

    console.log(`✅ Successfully created project in ./${projectName}`);
    return {
      projectDir: path.normalize(projectDir), // Ensure clean path
      projectName,
      success: true
    };

  } catch (err) {
    // Cleanup on failure
    if (await fs.pathExists(projectDir)) {
      await fs.remove(projectDir).catch(() => {});
    }
    throw err;
  }
};