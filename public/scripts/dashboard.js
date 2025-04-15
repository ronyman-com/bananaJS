import { createFile } from '../../lib/create-file.js';
import { createFolder } from '../../lib/create-folder.js';

class AppState {
   // Navigation functions
   showDashboard() {
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('file-manager-section').classList.add('hidden');
    document.getElementById('terminal-section').classList.add('hidden');
}

showFileManager() {
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('file-manager-section').classList.remove('hidden');
    document.getElementById('terminal-section').classList.add('hidden');
    this.loadFileTree();
}

showTerminal() {
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('file-manager-section').classList.add('hidden');
    document.getElementById('terminal-section').classList.remove('hidden');
    if (!this.terminal) {
        this.initTerminal();
    }
}

// Modal functions
openCreateProjectModal() {
    document.getElementById('projectName').value = '';
    document.getElementById('initGit').checked = false;
    document.getElementById('useYarn').checked = false;
    document.getElementById('cli-output').innerHTML = '';
    document.getElementById('cli-output').classList.add('hidden');
    this.openModal('createProjectModal');
}

openCreateAppModal() {
    document.getElementById('appName').value = '';
    document.getElementById('appTemplate').value = 'react';
    this.openModal('createAppModal');
}

// Initialize the application and expose methods
init() {
    // ... [existing init code] ...

    // Expose methods to window
    window.showDashboard = () => this.showDashboard();
    window.showFileManager = () => this.showFileManager();
    window.showTerminal = () => this.showTerminal();
    window.openCreateProjectModal = () => this.openCreateProjectModal();
    window.openCreateAppModal = () => this.openCreateAppModal();
}

    
    constructor() {
      // State properties
      this.ws = null;
      this.currentDirectory = '';
      this.terminal = null;
      this.terminalFitAddon = null;
      this.hmrUpdates = [];
      this.codeEditor = null;
      this.contextMenuTarget = null;
      this.currentFile = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 10;
      this.reconnectDelay = 1000;
    }
  
    // Initialize the application
    init() {
      console.log('Initializing application...');
      this.initWebSocket();
      this.initEditor();
      this.loadFileTree();
      this.setupEventListeners();
      this.showDashboard();
    }
  
    // WebSocket methods
    initWebSocket() {
      console.log('Initializing WebSocket connection...');
      
      // Clean up existing connection
      this.cleanupWebSocket();
  
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${window.location.host}/ws`;
        
        console.log(`Connecting to WebSocket at: ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = this.handleWebSocketOpen.bind(this);
        this.ws.onmessage = this.handleWebSocketMessage.bind(this);
        this.ws.onclose = this.handleWebSocketClose.bind(this);
        this.ws.onerror = this.handleWebSocketError.bind(this);
      } catch (error) {
        console.error('WebSocket initialization error:', error);
        this.showNotification('Failed to initialize WebSocket', 'error');
      }
    }
  
    cleanupWebSocket() {
      if (this.ws) {
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.close();
        }
      }
    }
  
    handleWebSocketOpen() {
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(true);
      console.log('WebSocket connected successfully');
      this.showNotification('Connected to development server', 'success');
    }
  
    handleWebSocketMessage(event) {
      console.debug('WebSocket message received:', event.data);
      try {
        const message = JSON.parse(event.data);
        this.processWebSocketMessage(message);
      } catch (error) {
        console.error('Error processing message:', error, 'Raw data:', event.data);
        this.showNotification('Error processing server message', 'error');
      }
    }
  
    processWebSocketMessage(message) {
      if (!message || typeof message !== 'object') {
        console.error('Invalid message format:', message);
        return;
      }
  
      const handlers = {
        'metrics': () => message.data && this.updateMetrics(message.data),
        'update': () => message.file && message.time && this.handleHmrUpdate(message),
        'file-change': () => message.file && this.handleFileChange(message.file),
        'build-complete': () => message.time && this.handleBuildComplete(message.time),
        'terminal-output': () => message.data && this.handleTerminalOutput(message.data),
        'error': () => message.message && this.showNotification(`Server error: ${message.message}`, 'error')
      };
  
      if (handlers[message.type]) {
        handlers[message.type]();
      } else {
        console.warn('Unknown message type:', message.type);
      }
    }
  
    handleWebSocketClose(event) {
      console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
      this.updateConnectionStatus(false);
      
      if (event.code === 1000) return; // Normal closure
  
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        console.log(`Attempting reconnect #${this.reconnectAttempts + 1} in ${delay}ms...`);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.initWebSocket();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
        this.showNotification('Failed to reconnect to server', 'error');
      }
    }
  
    handleWebSocketError(error) {
      console.error('WebSocket error:', error);
      this.showNotification('WebSocket connection error', 'error');
    }
  
    // Connection status methods
    updateConnectionStatus(connected) {
      const statusElement = document.getElementById('connection-status');
      if (!statusElement) {
        console.error('Connection status element not found');
        return;
      }
  
      if (connected) {
        statusElement.innerHTML = `
          <i class="fas fa-check-circle mr-2"></i>
          <span>Connected to development server</span>
        `;
        statusElement.className = 'p-3 mb-4 rounded bg-green-100 text-green-800';
      } else {
        const reconnectInfo = this.reconnectAttempts > 0 
          ? ` (reconnecting ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          : '';
        
        statusElement.innerHTML = `
          <i class="fas fa-sync-alt fa-spin mr-2"></i>
          <span>Connecting to server${reconnectInfo}</span>
        `;
        statusElement.className = 'p-3 mb-4 rounded bg-yellow-100 text-yellow-800';
      }
    }
  
    testWebSocketConnection() {
      if (!this.ws) {
        console.error('WebSocket not initialized');
        return false;
      }
  
      const states = {
        [WebSocket.CONNECTING]: 'CONNECTING',
        [WebSocket.OPEN]: 'OPEN',
        [WebSocket.CLOSING]: 'CLOSING',
        [WebSocket.CLOSED]: 'CLOSED'
      };
  
      const state = states[this.ws.readyState] || 'UNKNOWN';
      console.log(`WebSocket state: ${state}`);
      return this.ws.readyState === WebSocket.OPEN;
    }




    // File tree methods
    async loadFileTree(directory = '') {
      try {
        this.currentDirectory = directory;
        this.updatePathDisplay(directory);
  
        const response = await fetch(`/api/files?directory=${encodeURIComponent(directory)}`);
        
        if (!response.ok) {
          throw new Error(await response.text() || 'Failed to load directory');
        }
  
        const files = await response.json();
        this.renderFileTree(files);
        
      } catch (error) {
        console.error('File tree error:', error);
        this.showNotification(`Failed to load directory: ${error.message}`, 'error');
        this.showErrorState(error.message);
      }
    }
  
     // UI Navigation Functions
     showFileManager() {
        // Hide other sections
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('terminal-section').classList.add('hidden');
        
        // Show file manager section
        const fileManagerSection = document.getElementById('file-manager-section');
        fileManagerSection.classList.remove('hidden');
        
        // Initialize file tree if not already loaded
        if (document.getElementById('file-tree').children.length === 0) {
            this.loadFileTree(this.currentDirectory || '');
        }
        
        // Update path display
        this.updatePathDisplay(this.currentDirectory);
    }

    updatePathDisplay(directory) {
        const pathDisplay = document.getElementById('current-path');
        if (!pathDisplay) return;
    
        const formattedPath = directory 
            ? `Current path: /${directory.replace(/\\/g, '/')}` 
            : 'Current path: /';
        
        pathDisplay.innerHTML = `
            <span style="color: #a0aec0;">${formattedPath}</span>
            ${directory ? `
            <button onclick="appState.loadFileTree('')" 
                    class="ml-2 text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition">
                Go to root
            </button>
            ` : ''}
            <button onclick="appState.copyCurrentPath()" 
                    class="ml-2 text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition">
                <i class="fas fa-copy mr-1"></i> Copy Path
            </button>
        `;
    }

  
    renderFileTree(files) {
      const fileTree = document.getElementById('file-tree');
      if (!fileTree) return;
  
      if (!files || files.length === 0) {
        fileTree.innerHTML = this.getEmptyDirectoryHTML();
        return;
      }
  
      fileTree.innerHTML = this.getBreadcrumbs() + this.getFileListHTML(files);
      this.setupFileEventListeners(files);
    }
  
    getEmptyDirectoryHTML() {
      return `
        <li class="text-gray-400 py-2">
          Empty directory
          <button onclick="appState.showCreateFileModal()"
                  class="ml-2 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition">
            <i class="fas fa-file mr-1"></i> New File
          </button>
          <button onclick="appState.showCreateFolderModal()"
                  class="ml-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition">
            <i class="fas fa-folder mr-1"></i> New Folder
          </button>
        </li>
      `;
    }
  
    getBreadcrumbs() {
      if (!this.currentDirectory) return '';
  
      const parts = this.currentDirectory.split('/');
      let breadcrumbHtml = '<li class="breadcrumbs mb-2 pb-2 border-b border-gray-700">';
      
      parts.reduce((acc, part) => {
        const path = acc ? `${acc}/${part}` : part;
        breadcrumbHtml += `
          <span class="text-gray-400">/</span>
          <button onclick="appState.loadFileTree('${path}')" 
                  class="text-yellow-400 hover:text-yellow-300">
            ${part}
          </button>
        `;
        return path;
      }, '');
  
      return breadcrumbHtml + '</li>';
    }
  
    getFileListHTML(files) {
      return files
        .sort(this.sortFiles)
        .map(file => this.getFileItemHTML(file))
        .join('');
    }
  
    sortFiles(a, b) {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    }
  
    getFileItemHTML(file) {
      return `
        <li class="flex items-center justify-between py-2 px-3 hover:bg-gray-700 rounded cursor-pointer ${file.isDirectory ? 'folder' : 'file'}" 
            oncontextmenu="appState.showContextMenu(event, '${file.name}')">
          <div class="flex items-center">
            ${file.isDirectory ? '<i class="fas fa-folder text-yellow-400 mr-2"></i>' : '<i class="fas fa-file text-white mr-2"></i>'}
            <span class="item-name">${file.name}</span>
          </div>
          <div class="flex items-center">
            ${!file.isDirectory ? `
              <span class="text-xs text-gray-400 mr-2">${this.formatFileSize(file.size)}</span>
              <button onclick="event.stopPropagation(); appState.openFileForEditing('${file.path}')" 
                      class="file-actions text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded mr-2">
                <i class="fas fa-edit mr-1"></i> Edit
              </button>
            ` : ''}
            ${file.isDirectory ? 
              `<button onclick="event.stopPropagation(); appState.loadFileTree('${file.path}')" 
                      class="file-actions text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                <i class="fas fa-folder-open mr-1"></i> Open
              </button>` : ''}
          </div>
        </li>
      `;
    }
  
    setupFileEventListeners(files) {
      files.filter(file => file.isDirectory).forEach(file => {
        const item = document.querySelector(`[oncontextmenu*="${file.name}"]`);
        if (item) {
          item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-actions') && 
                !e.target.classList.contains('fa-edit') && 
                !e.target.classList.contains('fa-folder-open')) {
              const newPath = this.currentDirectory 
                ? `${this.currentDirectory}/${file.name}` 
                : file.name;
              this.loadFileTree(newPath);
            }
          });
        }
      });
    }
  
    refreshFileTree() {
      this.loadFileTree(this.currentDirectory);
    }
  
    showErrorState(message) {
      document.getElementById('file-tree').innerHTML = `
        <li class="text-red-400 py-2">
          ${message}
          <button onclick="appState.loadFileTree('')" 
                  class="ml-2 text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition">
            <i class="fas fa-home mr-1"></i> Return to root
          </button>
        </li>
      `;
    }
  
    // File operations
    showCreateFileModal() {
      document.getElementById('fileName').value = '';
      document.getElementById('fileTemplate').value = 'empty';
      this.openModal('createFileModal');
    }
  
    showCreateFolderModal() {
      document.getElementById('folderName').value = '';
      this.openModal('createFolderModal');
    }
  
    uploadFile() {
      this.openModal('uploadModal');
    }
  
    startUpload() {
      const files = document.getElementById('file-upload').files;
      if (files.length === 0) return;
  
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      formData.append('directory', this.currentDirectory);
  
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
  
      // Progress tracking
      document.getElementById('upload-progress').classList.remove('hidden');
      document.getElementById('upload-button').disabled = true;
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          document.getElementById('upload-progress-bar').style.width = `${percentComplete}%`;
          document.getElementById('upload-status').textContent = `Uploading: ${percentComplete}%`;
        }
      };
  
      xhr.onload = () => {
        if (xhr.status === 200) {
          this.showNotification('Files uploaded successfully', 'success');
          this.closeModal('uploadModal');
          this.refreshFileTree();
        } else {
          this.showNotification('File upload failed', 'error');
        }
        document.getElementById('upload-progress').classList.add('hidden');
        document.getElementById('upload-button').disabled = false;
      };
  
      xhr.onerror = () => {
        this.showNotification('File upload failed', 'error');
        document.getElementById('upload-progress').classList.add('hidden');
        document.getElementById('upload-button').disabled = false;
      };
  
      xhr.send(formData);
    }
  
    async createNewFile() {
      const fileName = document.getElementById('fileName').value.trim();
      const template = document.getElementById('fileTemplate').value;
      
      if (!fileName) {
        this.showNotification('Please enter a file name', 'error');
        return;
      }
  
      try {
        const response = await fetch('/api/create-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: this.currentDirectory,
            name: fileName,
            template: template
          })
        });
  
        const result = await response.json();
        
        if (response.ok) {
          this.showNotification('File created successfully', 'success');
          this.closeModal('createFileModal');
          this.refreshFileTree();
        } else {
          throw new Error(result.error || 'Failed to create file');
        }
      } catch (error) {
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  
    async createNewFolder() {
      const folderName = document.getElementById('folderName').value.trim();
      
      if (!folderName) {
        this.showNotification('Please enter a folder name', 'error');
        return;
      }
  
      try {
        const response = await fetch('/api/create-folder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: this.currentDirectory,
            name: folderName
          })
        });
  
        const result = await response.json();
        
        if (response.ok) {
          this.showNotification('Folder created successfully', 'success');
          this.closeModal('createFolderModal');
          this.refreshFileTree();
        } else {
          throw new Error(result.error || 'Failed to create folder');
        }
      } catch (error) {
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  
    // Context Menu
    showContextMenu(event, target) {
      event.preventDefault();
      this.contextMenuTarget = target;
      
      const menu = document.getElementById('context-menu');
      menu.style.display = 'block';
      menu.style.left = `${event.pageX}px`;
      menu.style.top = `${event.pageY}px`;
      
      // Hide menu when clicking elsewhere
      document.addEventListener('click', this.hideContextMenu.bind(this));
    }
  
    hideContextMenu() {
      document.getElementById('context-menu').style.display = 'none';
      document.removeEventListener('click', this.hideContextMenu.bind(this));
    }
  
    contextMenuAction(action) {
      if (!this.contextMenuTarget) return;
      
      const path = this.currentDirectory 
        ? `${this.currentDirectory}/${this.contextMenuTarget}` 
        : this.contextMenuTarget;
  
      switch (action) {
        case 'open':
          if (this.contextMenuTarget.includes('.')) {
            this.openFileForEditing(path);
          } else {
            this.loadFileTree(path);
          }
          break;
        case 'rename':
          this.renameFile(path);
          break;
        case 'delete':
          this.deleteFile(path);
          break;
        case 'download':
          this.downloadFile(path);
          break;
        case 'copy-path':
          this.copyToClipboard(path);
          break;
      }
      
      this.hideContextMenu();
    }
  
    async renameFile(path) {
      const newName = prompt('Enter new name:', path.split('/').pop());
      if (!newName) return;
  
      try {
        const response = await fetch('/api/rename', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldPath: path,
            newName: newName
          })
        });
  
        const result = await response.json();
        
        if (response.ok) {
          this.showNotification('File renamed successfully', 'success');
          this.refreshFileTree();
        } else {
          throw new Error(result.error || 'Failed to rename file');
        }
      } catch (error) {
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  
    async deleteFile(path) {
      if (!confirm(`Are you sure you want to delete ${path}?`)) return;
  
      try {
        const response = await fetch('/api/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: path
          })
        });
  
        const result = await response.json();
        
        if (response.ok) {
          this.showNotification('File deleted successfully', 'success');
          this.refreshFileTree();
        } else {
          throw new Error(result.error || 'Failed to delete file');
        }
      } catch (error) {
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  
    downloadFile(path) {
      window.open(`/api/download?path=${encodeURIComponent(path)}`, '_blank');
    }
  
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('Copied to clipboard', 'success');
      }).catch(err => {
        this.showNotification('Failed to copy to clipboard', 'error');
      });
    }
  
    copyCurrentPath() {
      const path = this.currentDirectory || '/';
      this.copyToClipboard(path);
    }
  
    // Editor functions
    initEditor() {
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
      
      require(['vs/editor/editor.main'], () => {
        this.codeEditor = monaco.editor.create(document.getElementById('editor'), {
          value: '',
          language: 'javascript',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: true },
          fontSize: 14,
          scrollBeyondLastLine: false
        });
        
        // Listen for changes
        this.codeEditor.onDidChangeModelContent(() => {
          document.getElementById('editor-status').textContent = 'Unsaved changes';
          document.getElementById('editor-status').className = 'text-xs ml-2 px-2 py-1 rounded bg-yellow-600';
          document.getElementById('editor-status').classList.remove('hidden');
        });
      });
    }
  
    async openFileForEditing(filePath) {
      try {
        const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
        if (!response.ok) {
          throw new Error(await response.text() || 'Failed to read file');
        }
        
        const fileContent = await response.text();
        const language = this.getLanguageFromExtension(filePath);
        
        if (this.codeEditor) {
          this.codeEditor.setValue(fileContent);
          monaco.editor.setModelLanguage(this.codeEditor.getModel(), language);
          
          document.getElementById('editor-filename').textContent = filePath;
          document.getElementById('editor-status').classList.add('hidden');
          document.getElementById('editor-container').classList.remove('hidden');
          
          // Store current file path
          this.currentFile = filePath;
        }
      } catch (error) {
        this.showNotification(`Error opening file: ${error.message}`, 'error');
      }
    }
  
    async saveCurrentFile() {
      if (!this.codeEditor || !this.currentFile) return;
  
      try {
        const content = this.codeEditor.getValue();
        const response = await fetch('/api/save-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: this.currentFile,
            content: content
          })
        });
  
        const result = await response.json();
        
        if (response.ok) {
          document.getElementById('editor-status').textContent = 'Saved';
          document.getElementById('editor-status').className = 'text-xs ml-2 px-2 py-1 rounded bg-green-600';
          document.getElementById('editor-status').classList.remove('hidden');
          this.showNotification('File saved successfully', 'success');
        } else {
          throw new Error(result.error || 'Failed to save file');
        }
      } catch (error) {
        this.showNotification(`Error saving file: ${error.message}`, 'error');
      }
    }
  
    closeEditor() {
      document.getElementById('editor-container').classList.add('hidden');
      this.currentFile = null;
    }
  
    getLanguageFromExtension(filePath) {
      const extension = filePath.split('.').pop().toLowerCase();
      
      switch (extension) {
        case 'js': return 'javascript';
        case 'jsx': return 'javascript';
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'scss': return 'scss';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'py': return 'python';
        default: return 'plaintext';
      }
    }
  
    // Project Creation
    openCreateProjectModal() {
      document.getElementById('projectName').value = '';
      document.getElementById('initGit').checked = false;
      document.getElementById('useYarn').checked = false;
      document.getElementById('cli-output').innerHTML = '';
      document.getElementById('cli-output').classList.add('hidden');
      this.openModal('createProjectModal');
    }
  
    async createProjectWithCLI() {
      const projectName = document.getElementById('projectName').value.trim();
      const initGit = document.getElementById('initGit').checked;
      const useYarn = document.getElementById('useYarn').checked;
      const template = document.getElementById('projectTemplate').value;
  
      try {
        const response = await fetch('/api/create-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: projectName,
            git: initGit,
            packageManager: useYarn ? 'yarn' : 'npm',
            template: template
          })
        });
  
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Project creation failed');
        }
  
        // Enhanced success notification
        this.showNotification(`
          <strong>Project created successfully!</strong>
          <div style="margin-top: 8px; font-size: 0.9em;">
            <div>Name: ${result.projectName}</div>
            <div>Path: ${result.projectDir}</div>
            <div>Package manager: ${result.packageManager}</div>
          </div>
        `, 'success', 8000);
  
        // Refresh file tree starting from the new project's parent directory
        const parentDir = result.projectDir.split('/').slice(0, -1).join('/') || '/';
        this.loadFileTree(parentDir);
        this.closeModal('createProjectModal');
  
      } catch (error) {
        this.showNotification(`Error: ${error.message}`, 'error');
        console.error('Project Creation Error:', {
          error: error.message,
          projectName,
          time: new Date().toISOString()
        });
      }
    }
  
    // App Creation
    openCreateAppModal() {
      document.getElementById('appName').value = '';
      document.getElementById('appTemplate').value = 'react';
      this.openModal('createAppModal');
    }
  
    async createApp() {
      const appName = document.getElementById('appName').value.trim();
      const template = document.getElementById('appTemplate').value;
      
      if (!appName) {
        this.showNotification('Please enter an app name', 'error');
        return;
      }
  
      if (!/^[a-z0-9-]+$/i.test(appName)) {
        this.showNotification('Invalid app name (only letters, numbers, and hyphens allowed)', 'error');
        return;
      }
      
      try {
        this.showNotification(`Creating app "${appName}"...`, 'info');
        
        const response = await fetch('/api/create-app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appName, template })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          this.showNotification(result.message || 'App created successfully', 'success');
          
          if (result.appPath) {
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.innerHTML = `
              ${result.message}<br>
              <small>Path: ${result.appPath}</small>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
          }
          
          this.closeModal('createAppModal');
          this.refreshFileTree();
        } else {
          throw new Error(result.error || 'Failed to create app');
        }
      } catch (error) {
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  
    // System Functions
    runBuild() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'build-command',
          command: 'build'
        }));
        this.showNotification('Build process started...', 'info');
      } else {
        this.showNotification('Not connected to server', 'error');
      }
    }
  
    restartServer() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'restart-command'
        }));
        this.showNotification('Server restart initiated...', 'warning');
      } else {
        this.showNotification('Not connected to server', 'error');
      }
    }
  
    // Terminal Functions
    initTerminal() {
      const terminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1a1a1a',
          foreground: '#ffffff'
        }
      });
      
      this.terminalFitAddon = new FitAddon();
      terminal.loadAddon(this.terminalFitAddon);
      
      terminal.open(document.getElementById('terminal'));
      this.terminal = terminal;
      this.terminalFitAddon.fit();
      
      // Handle terminal input
      terminal.onData(data => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'terminal-input',
            data: data
          }));
        }
      });
      
      // Handle terminal resize
      window.addEventListener('resize', () => {
        this.terminalFitAddon.fit();
      });
    }
  
    sendTerminalCommand() {
      const input = document.getElementById('terminal-input');
      const command = input.value.trim();
      
      if (command && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'terminal-command',
          command: command
        }));
        input.value = '';
      }
    }
  
    clearTerminal() {
      if (this.terminal) {
        this.terminal.clear();
      }
    }
  
    runCommand(command) {
      if (this.terminal && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'terminal-command',
          command: command
        }));
      }
    }
  
    // UI Functions
    showDashboard() {
      document.getElementById('dashboard-section').classList.remove('hidden');
      document.getElementById('file-manager-section').classList.add('hidden');
      document.getElementById('terminal-section').classList.add('hidden');
    }
  
    showFileManager() {
      document.getElementById('dashboard-section').classList.add('hidden');
      document.getElementById('file-manager-section').classList.remove('hidden');
      document.getElementById('terminal-section').classList.add('hidden');
      this.loadFileTree();
    }
  
    showTerminal() {
      document.getElementById('dashboard-section').classList.add('hidden');
      document.getElementById('file-manager-section').classList.add('hidden');
      document.getElementById('terminal-section').classList.remove('hidden');
      if (!this.terminal) {
        this.initTerminal();
      }
    }
  
    // Modal functions
    openModal(modalId) {
      document.getElementById('modal-overlay').style.display = 'block';
      document.getElementById(modalId).style.display = 'block';
    }
  
    closeModal(modalId) {
      document.getElementById('modal-overlay').style.display = 'none';
      document.getElementById(modalId).style.display = 'none';
    }
  
    // Helper functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        if (isNaN(bytes)) return 'NaN';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(
          Math.floor(Math.log(bytes) / Math.log(1024)),
          sizes.length - 1
        );
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
      }
  
    showNotification(message, type = 'info', duration = 5000) {
      const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        info: '<i class="fas fa-info-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>'
      };
      
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-message">${message}</span>
      `;
      
      document.body.appendChild(notification);
      
      // Remove notification after duration
      setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s forwards';
        notification.addEventListener('animationend', () => {
          notification.remove();
        });
      }, duration);
      
      // Click to dismiss
      notification.addEventListener('click', () => {
        notification.style.animation = 'fadeOut 0.3s forwards';
        notification.addEventListener('animationend', () => {
          notification.remove();
        });
      });
    }
  
    // HMR Update handling
    handleHmrUpdate(update) {
      this.hmrUpdates.push(update);
      this.showNotification(`File updated: ${update.file}`, 'info');
      
      // Update the editor if the file is currently open
      if (this.currentFile && this.currentFile.endsWith(update.file)) {
        this.openFileForEditing(this.currentFile);
      }
    }
  
    // File change handling
    handleFileChange(filePath) {
      this.showNotification(`File changed: ${filePath}`, 'info');
      
      // Refresh the file tree if the change is in the current directory
      const dir = filePath.split('/').slice(0, -1).join('/');
      if (dir === this.currentDirectory || filePath.startsWith(this.currentDirectory)) {
        this.refreshFileTree();
      }
    }
  
    // Build complete handling
    handleBuildComplete(buildTime) {
      this.showNotification(`Build completed in ${buildTime}ms`, 'success');
    }
  
    // Terminal output handling
    handleTerminalOutput(output) {
      if (this.terminal) {
        this.terminal.write(output);
      }
    }
  
    // Metrics update handling
    updateMetrics(metrics) {
      const metricsElement = document.getElementById('system-metrics');
      if (metricsElement) {
        metricsElement.innerHTML = `
          <div class="metric">
            <span class="metric-label">CPU:</span>
            <span class="metric-value">${metrics.cpu}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Memory:</span>
            <span class="metric-value">${metrics.memory}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Uptime:</span>
            <span class="metric-value">${metrics.uptime}</span>
          </div>
        `;
      }
    }
  
    // Setup event listeners
    setupEventListeners() {
      // Initialize drag and drop for file upload
      const uploadDropZone = document.querySelector('#uploadModal .border-dashed');
      const fileUpload = document.getElementById('file-upload');
      
      if (uploadDropZone && fileUpload) {
        uploadDropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          uploadDropZone.classList.add('border-yellow-400', 'bg-gray-700');
        });
        
        uploadDropZone.addEventListener('dragleave', () => {
          uploadDropZone.classList.remove('border-yellow-400', 'bg-gray-700');
        });
        
        uploadDropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          uploadDropZone.classList.remove('border-yellow-400', 'bg-gray-700');
          fileUpload.files = e.dataTransfer.files;
        });
        
        // Initialize file input click
        uploadDropZone.addEventListener('click', () => {
          fileUpload.click();
        });
      }
  
      // Close modals when clicking overlay
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
          document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
          });
          modalOverlay.style.display = 'none';
        });
      }
  
      // Prevent modal content from closing when clicking inside
      document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      });
  
      // Setup keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Save file with Ctrl+S
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          this.saveCurrentFile();
        }
        
        // Close editor with Escape
        if (e.key === 'Escape' && !document.getElementById('modal-overlay').style.display) {
          this.closeEditor();
        }
      });
    }


   /**
   * Create a new file with optional template
   */
   async createNewFile() {
    const fileName = document.getElementById('fileName').value.trim();
    const template = document.getElementById('fileTemplate').value;
    const customContent = document.getElementById('fileCustomContent')?.value || '';

    if (!fileName) {
      this.showNotification('Please enter a file name', 'error');
      return;
    }

    try {
      // Construct full path
      const fullPath = path.join(process.cwd(), this.currentDirectory || '', fileName);

      // Use the imported createFile function
      const result = await createFile(fullPath, {
        template,
        content: customContent
      });

      this.showNotification(`File created: ${fileName}`, 'success');
      this.closeModal('createFileModal');
      this.refreshFileTree();

      // Open the file for editing if it's a text file
      const textFileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.txt'];
      if (textFileExtensions.some(ext => fileName.endsWith(ext))) {
        const filePath = this.currentDirectory 
          ? `${this.currentDirectory}/${fileName}` 
          : fileName;
        this.openFileForEditing(filePath);
      }

      return result;
    } catch (error) {
      console.error('File creation error:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Create a new folder
   */
  async createNewFolder() {
    const folderName = document.getElementById('folderName').value.trim();
    
    if (!folderName) {
      this.showNotification('Please enter a folder name', 'error');
      return;
    }

    // Validate folder name
    if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
      this.showNotification('Invalid folder name (only letters, numbers, underscores and hyphens allowed)', 'error');
      return;
    }

    try {
      // Construct full path
      const fullPath = path.join(process.cwd(), this.currentDirectory || '', folderName);

      // Use the imported createFolder function
      const result = await createFolder(fullPath);

      this.showNotification(`Folder created: ${folderName}`, 'success');
      this.closeModal('createFolderModal');
      this.refreshFileTree();

      return result;
    } catch (error) {
      console.error('Folder creation error:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    if (!window.WebSocket) {
      const error = 'WebSocket not supported in this browser';
      console.error(error);
      const statusElement = document.getElementById('connection-status');
      if (statusElement) {
        statusElement.innerHTML = `
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <span>${error}</span>
        `;
      }
      return;
    }
  
    try {
      window.appState = new AppState();
      appState.init();
      
      // Add manual reconnect button for debugging
      const statusElement = document.getElementById('connection-status');
      if (statusElement) {
        const reconnectBtn = document.createElement('button');
        reconnectBtn.className = 'ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded';
        reconnectBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Reconnect';
        reconnectBtn.onclick = () => {
          console.log('Manual reconnect triggered');
          appState.initWebSocket();
        };
        statusElement.appendChild(reconnectBtn);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      const errorElement = document.createElement('div');
      errorElement.className = 'p-4 bg-red-100 text-red-800';
      errorElement.innerHTML = `
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <span>Application failed to initialize: ${error.message}</span>
      `;
      document.body.prepend(errorElement);
    }
});



