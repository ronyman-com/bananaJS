const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

async function getLatestBananaVersion() {
  try {
    const response = await axios.get('https://registry.npmjs.org/@ronyman/bananajs/latest');
    return response.data.version;
  } catch (err) {
    console.warn('Failed to fetch latest version, using fallback');
    return '^0.0.2'; // Fallback version
  }
}

module.exports = async function createApp(appName, template, options = {}) {
  // Normalize template name to lowercase
  template = template.toLowerCase();
  const validTemplates = ['docs', 'vue', 'react'];

  if (!validTemplates.includes(template)) {
    throw new Error(`Invalid template "${template}". Use: ${validTemplates.join(', ')}`);
  }

  const appDir = path.join(options.cwd || process.cwd(), appName);
  const templateDir = path.join(__dirname, '..', 'templates', template);
  const bananaVersion = await getLatestBananaVersion();

  console.log(`Creating ${template} app '${appName}'...`);
  console.log(`Template directory: ${templateDir}`);

  try {
    // Verify template exists
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    await fs.ensureDir(appDir);
    const files = await fs.readdir(templateDir);
    
    for (const file of files) {
      const sourcePath = path.join(templateDir, file);
      const destPath = path.join(appDir, file);
      
      if (file === 'package.json') {
        let content = await fs.readFile(sourcePath, 'utf8');
        content = content
          .replace('{{app-name}}', appName.toLowerCase().replace(/\s+/g, '-'))
          .replace('{{banana-version}}', `^${bananaVersion}`);
        await fs.writeFile(destPath, content);
      } else {
        await fs.copy(sourcePath, destPath);
      }
    }

    console.log(`✅ Successfully created ${template} app at ${appDir}`);
    return {
      appDir,
      template,
      packageManager: options.packageManager || 'npm',
      bananaVersion
    };

  } catch (err) {
    console.error(`❌ Error creating ${template} app:`);
    console.error(err.message);
    throw err;
  }
};