// lib/detect-framework.cjs
const fs = require('fs-extra');
const path = require('path');
const { dependencies = {}, devDependencies = {} } = require('../package.json');

/**
 * Detects the JavaScript framework being used in a project
 * @param {string} projectPath - Path to the project directory
 * @returns {'react'|'vue'|'unknown'} - Detected framework
 */
function detectFramework(projectPath = process.cwd()) {
  try {
    // 1. Check current project's package.json (for monorepo support)
    const localDeps = { ...dependencies, ...devDependencies };
    const localResult = checkDependencies(localDeps);
    if (localResult) return localResult;

    // 2. Check target project's package.json
    const targetPkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(targetPkgPath)) {
      try {
        const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'));
        const targetDeps = { ...targetPkg.dependencies, ...targetPkg.devDependencies };
        const depResult = checkDependencies(targetDeps);
        if (depResult) return depResult;
      } catch (err) {
        console.warn('⚠️ Failed to parse package.json:', err.message);
      }
    }

    // 3. Check file structure patterns
    const vueFiles = ['App.vue', 'main.js', 'vite.config.js'].some(file => 
      fs.existsSync(path.join(projectPath, 'src', file))
    );
    
    const reactFiles = ['App.jsx', 'main.jsx', 'index.jsx'].some(file => 
      fs.existsSync(path.join(projectPath, 'src', file))
    );

    if (vueFiles) return 'vue';
    if (reactFiles) return 'react';

    // 4. Check entry file content (for build.cjs compatibility)
    const configPath = path.join(projectPath, 'bin', 'banana.config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.entry) {
        const entryPath = path.join(projectPath, config.entry);
        if (fs.existsSync(entryPath)) {
          const content = fs.readFileSync(entryPath, 'utf8');
          if (content.includes('from \'react\'') || content.includes('from "react"')) {
            return 'react';
          }
          if (content.includes('from \'vue\'') || content.includes('from "vue"')) {
            return 'vue';
          }
        }
      }
    }

    // 5. Default to React for BananaJS core project
    const isBananaCore = projectPath.includes(path.join('bananaJS', 'Banana'));
    return isBananaCore ? 'react' : 'unknown';
  } catch (err) {
    console.error('🚨 Framework detection failed:', err);
    return 'unknown';
  }
}

/**
 * Checks dependencies object for framework indicators
 * @param {Object} deps - Combined dependencies object
 * @returns {'react'|'vue'|null} - Detected framework or null
 */
function checkDependencies(deps) {
  // Vue detection
  if (deps.vue || deps['vue-router'] || deps['@vitejs/plugin-vue']) {
    return 'vue';
  }
  
  // React detection
  if (deps.react || deps['react-dom'] || deps['@vitejs/plugin-react']) {
    return 'react';
  }
  
  return null;
}

// Export with multiple patterns for compatibility
module.exports = detectFramework;
module.exports.detectFramework = detectFramework;
module.exports.default = detectFramework;