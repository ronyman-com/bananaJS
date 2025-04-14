const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Shared validation function (matches CLI)
const validateProjectName = (name) => {
  if (!name || !/^[a-z0-9-]+$/i.test(name)) {
    throw new Error('Invalid project name (only letters, numbers, and hyphens allowed)');
  }
  return name.trim();
};

// Main function with CLI-compatible options
module.exports = async function createProject(projectName, options = {}) {
  // Validate input using shared validation
  const validatedName = validateProjectName(projectName);
  
  // Path setup - matches CLI behavior
  const projectDir = path.resolve(process.cwd(), validatedName);
  const templateDir = path.resolve(__dirname, '../Projects/templates/default');

  // Verify template exists
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Default template not found at: ${templateDir}`);
  }

  console.log(`Creating project '${validatedName}' in ${projectDir}`);

  try {
    // Create project directory
    await fs.ensureDir(projectDir);

    // Copy template files
    await fs.copy(templateDir, projectDir);

    // Process package.json with same replacements as CLI
    const pkgPath = path.join(projectDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      let content = await fs.readFile(pkgPath, 'utf8');
      content = content
        .replace(/{{project-name}}/g, validatedName.toLowerCase())
        .replace(/{{banana-version}}/g, await getLatestVersion())
        .replace(/{{timestamp}}/g, new Date().toISOString());
      await fs.writeFile(pkgPath, content);
    }

    // Initialize Git repo if requested (matches CLI option)
    if (options.git) {
      try {
        await exec('git init', { cwd: projectDir });
        console.log('✓ Initialized Git repository');
      } catch (gitError) {
        console.warn('⚠ Could not initialize Git:', gitError.message);
      }
    }

    return {
      projectDir,
      projectName: validatedName,
      packageManager: options.packageManager || 'npm',
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

// Version check (matches CLI implementation)
async function getLatestVersion() {
  try {
    const { stdout } = await exec('npm view @ronyman/bananajs version');
    return `^${stdout.trim()}`;
  } catch {
    return '^0.1.0'; // Same fallback as CLI
  }
}