// lib/terminal/code_editor.js
const fs = require('fs').promises;
const path = require('path');

class CodeEditor {
  constructor() {
    this.editor = null;
    this.currentFile = null;
  }

  // Initialize Monaco Editor
  async initEditor(containerId) {
    // Load Monaco Editor
    const loaderScript = document.createElement('script');
    loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs/loader.min.js';
    loaderScript.onload = () => this.setupMonaco(containerId);
    document.head.appendChild(loaderScript);
  }

  setupMonaco(containerId) {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
    require(['vs/editor/editor.main'], () => {
      this.editor = monaco.editor.create(document.getElementById(containerId), {
        value: '',
        language: 'plaintext',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true }
      });
    });
  }

  // Open file in editor
  async openFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.currentFile = filePath;
      
      if (this.editor) {
        this.editor.setValue(content);
        const language = this.getLanguageFromExtension(filePath);
        monaco.editor.setModelLanguage(this.editor.getModel(), language);
      }
      
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Save current file
  async saveFile() {
    if (!this.currentFile || !this.editor) return false;
    
    try {
      await fs.writeFile(this.currentFile, this.editor.getValue());
      return true;
    } catch (error) {
      console.error('Save error:', error);
      return false;
    }
  }

  // Create new file
  async createFile(filePath, initialContent = '') {
    try {
      await fs.writeFile(filePath, initialContent);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create new folder
  async createFolder(folderPath) {
    try {
      await fs.mkdir(folderPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get language from file extension
  getLanguageFromExtension(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.md': 'markdown',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.php': 'php',
      '.rb': 'ruby',
      '.rs': 'rust',
      '.sh': 'shell',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml'
    };
    return languageMap[extension] || 'plaintext';
  }
}

module.exports = CodeEditor;