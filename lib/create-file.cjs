const fs = require('fs-extra');
const path = require('path');
// Use chalk 4.x (last CommonJS version)
const chalk = require('chalk'); 

const TEMPLATES = {
  javascript: `// JavaScript file\n\nfunction main() {\n  console.log('Hello World');\n}\n\nmain();`,
  typescript: `// TypeScript file\n\nexport default function main(): void {\n  console.log('Hello World');\n}\n\nmain();`,
  react: `import React from 'react';\n\nexport default function Component() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}`,
  html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>New Document</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`,
  css: `/* CSS Stylesheet */\n\nbody {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}`,
  empty: ''
};

module.exports = async function createFile(filePath, options = {}) {
  const { template = 'empty', content = '' } = options;
  const normalizedPath = path.normalize(filePath);
  const dirname = path.dirname(normalizedPath);

  try {
    if (await fs.pathExists(normalizedPath)) {
      throw new Error('File already exists');
    }
    
    await fs.ensureDir(dirname);
    const fileContent = content || TEMPLATES[template] || '';
    await fs.writeFile(normalizedPath, fileContent);
    
    return {
      success: true,
      path: normalizedPath,
      size: Buffer.byteLength(fileContent)
    };
  } catch (err) {
    console.error(chalk.red(`✖ Error: ${err.message}`));
    throw err;
  }
};