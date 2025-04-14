const createProject = require('./create-project.cjs');

module.exports = async (req, res) => {
  try {
    // Validate input matches CLI expectations
    if (!req.body || typeof req.body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { name: projectName, git, packageManager } = req.body;

    // Same validation as CLI
    if (!projectName || !/^[a-z0-9-]+$/i.test(projectName)) {
      throw new Error('Invalid project name (letters, numbers, hyphens only)');
    }

    // Call the existing CLI function
    const result = await createProject(projectName, {
      git: Boolean(git),
      packageManager: packageManager || 'npm'
    });

    res.json({
      success: true,
      projectDir: result.projectDir,
      projectName: result.projectName
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};