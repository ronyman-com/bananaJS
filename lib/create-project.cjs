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

  // --- FIX START ---
  // Determine the base directory for the new project.
  // Use the provided parentPath from options if available, otherwise use the current working directory.
  const baseDir = options.parentPath ? options.parentPath : process.cwd();

  // Construct the full project directory path by joining the base directory and the validated project name.
  const projectDir = path.join(baseDir, validatedName); // <-- Use baseDir here
  // --- FIX END ---

  const templateDir = path.resolve(__dirname, '../Projects/templates/default');

  // Verify template exists
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Default template not found at: ${templateDir}`);
  }

  console.log(`Creating project '${validatedName}' in ${projectDir}`);

  try {
    // Create project directory
    await fs.ensureDir(projectDir); // This will now create the directory inside baseDir

    // Copy template files
    await fs.copy(templateDir, projectDir);

    // Process package.json with same replacements as CLI
    const pkgPath = path.join(projectDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      let content = await fs.readFile(pkgPath, 'utf8');
      // Assuming getLatestVersion is available in this scope or imported
      // (Keeping the local function for now as it was in your provided code)
      const getLatestVersion = async () => {
         try {
           const { stdout } = await exec('npm view @ronyman/bananajs version');
           return `^${stdout.trim()}`;
         } catch {
           return '^0.1.0'; // Same fallback as CLI
         }
      };
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
      projectDir, // Return the correctly calculated projectDir
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
// Keeping this local function as it was in your provided code
async function getLatestVersion() {
  try {
    const { stdout } = await exec('npm view @ronyman/bananajs version');
    return `^${stdout.trim()}`;
  } catch {
    return '^0.1.0'; // Same fallback as CLI
  }
}

