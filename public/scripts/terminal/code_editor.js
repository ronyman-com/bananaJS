// public/scripts/terminal/code_editor.js - Browser-compatible version
class CodeEditor {
  constructor() {
    this.editor = null;
    this.currentFile = null;
    this.isInitialized = false;
  }

  // Initialize Monaco Editor with Promise
  initEditor(containerId) {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      // Check if Monaco is already loaded
      if (window.monaco && window.monaco.editor) {
        this.createEditor(containerId);
        resolve();
        return;
      }

      const loaderScript = document.createElement('script');
      loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs/loader.min.js';
      
      loaderScript.onload = () => {
        require.config({ 
          paths: { 
            vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' 
          }
        });
        
        require(['vs/editor/editor.main'], () => {
          this.createEditor(containerId);
          this.isInitialized = true;
          resolve();
        });
      };
      
      loaderScript.onerror = () => {
        reject(new Error('Failed to load Monaco Editor'));
      };
      
      document.head.appendChild(loaderScript);
    });
  }

  createEditor(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element #${containerId} not found`);
    }

    this.editor = monaco.editor.create(container, {
      value: '',
      language: 'plaintext',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      scrollBeyondLastLine: false
    });
  }

  // Set content in editor
  setContent(content, language = 'plaintext') {
    if (!this.editor) return;
    
    this.editor.setValue(content);
    const model = this.editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }

  // Get current content
  getContent() {
    return this.editor?.getValue() || '';
  }

  // Change editor language
  setLanguage(language) {
    if (!this.editor) return;
    const model = this.editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }

  // Get language from file extension (browser-compatible)
  getLanguageFromExtension(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'php': 'php',
      'rb': 'ruby',
      'rs': 'rust',
      'sh': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml'
    };
    return languageMap[extension] || 'plaintext';
  }
}

// Export for browser
window.CodeEditor = CodeEditor;