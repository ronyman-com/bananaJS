const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk'); 

module.exports = async function createFolder(folderPath, options = {}) {
  const { recursive = true } = options;
  const normalizedPath = path.normalize(folderPath);

  try {
    if (await fs.pathExists(normalizedPath)) {
      throw new Error('Folder already exists');
    }

    await fs.ensureDir(normalizedPath, { recursive });
    return { success: true, path: normalizedPath };
  } catch (err) {
    console.error(chalk.red(`✖ Error: ${err.message}`));
    throw err;
  }
};