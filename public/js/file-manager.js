import { AppState } from "./app-state.js";

class FileManager {
  constructor(appState) {
    this.appState = appState;
    this.currentDirectory = '';
    this.selectedItem = null;
    this.cachedFiles = {};
    this.domElements = {
      fileTree: document.getElementById('file-tree'),
      currentPath: document.getElementById('current-path'),
      contextMenu: document.getElementById('context-menu'),
      uploadButton: document.getElementById('upload-button'),
      fileUpload: document.getElementById('file-upload'),
      fileName: document.getElementById('fileName'),
      fileTemplate: document.getElementById('fileTemplate'),
      fileCustomContent: document.getElementById('fileCustomContent'),
      folderName: document.getElementById('folderName'),
      renameModal: document.getElementById('renameModal'),
      renameInput: document.getElementById('renameInput'),
      deleteModal: document.getElementById('deleteModal')
    };
    this.init();
  }

  // Initialization
  init() {
    this.initEventListeners();
    this.initDragAndDrop();
    this.loadFileTree();
  }

  initEventListeners() {
    // Document click handler
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#context-menu') && !e.target.closest('.file-item')) {
        this.hideContextMenu();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F5') this.refreshFileTree();
      if (e.key === 'Delete' && this.selectedItem) this.showDeleteConfirmation();
    });

    // Upload handlers
    if (this.domElements.uploadButton) {
      this.domElements.uploadButton.addEventListener('click', () => this.startUpload());
    }
    if (this.domElements.fileUpload) {
      this.domElements.fileUpload.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
    }
  }

  initDragAndDrop() {
    if (!this.domElements.fileTree) return;

    this.domElements.fileTree.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.domElements.fileTree.classList.add('drag-over');
    });

    this.domElements.fileTree.addEventListener('dragleave', () => {
      this.domElements.fileTree.classList.remove('drag-over');
    });

    this.domElements.fileTree.addEventListener('drop', (e) => {
      e.preventDefault();
      this.domElements.fileTree.classList.remove('drag-over');
      this.handleFileDrop(e);
    });
  }

  // Core File Operations
  async loadFileTree(directory = '', forceRefresh = false) {
    try {
      if (!forceRefresh && this.cachedFiles[directory]) {
        this.renderFileTree(this.cachedFiles[directory]);
        return;
      }

      this.currentDirectory = directory;
      this.updatePathDisplay(directory);

      const response = await this.fetchWithErrorHandling(
        `/api/files?directory=${encodeURIComponent(directory)}`,
        'Failed to load directory'
      );

      this.cachedFiles[directory] = await response.json();
      this.renderFileTree(this.cachedFiles[directory]);
    } catch (error) {
      this.handleError('File tree error:', error);
    }
  }

  refreshFileTree() {
    delete this.cachedFiles[this.currentDirectory];
    this.loadFileTree(this.currentDirectory, true);
  }

  // UI Rendering
  updatePathDisplay(directory) {
    if (!this.domElements.currentPath) return;

    this.domElements.currentPath.innerHTML = `
      <span class="text-gray-400">${directory ? `Current path: /${directory}` : 'Root directory'}</span>
      <div class="path-actions">
        ${directory ? `
          <button data-action="go-root" class="btn btn-sm btn-secondary">
            <i class="fas fa-home mr-1"></i> Root
          </button>
        ` : ''}
        <button data-action="copy-path" class="btn btn-sm btn-secondary">
          <i class="fas fa-copy mr-1"></i> Copy Path
        </button>
        <button data-action="refresh" class="btn btn-sm btn-secondary">
          <i class="fas fa-sync-alt mr-1"></i> Refresh
        </button>
      </div>
    `;

    // Add event listeners to the new buttons
    this.domElements.currentPath.querySelector('[data-action="go-root"]')
      ?.addEventListener('click', () => this.loadFileTree(''));
    this.domElements.currentPath.querySelector('[data-action="copy-path"]')
      ?.addEventListener('click', () => this.copyCurrentPath());
    this.domElements.currentPath.querySelector('[data-action="refresh"]')
      ?.addEventListener('click', () => this.refreshFileTree());
  }

  renderFileTree(files) {
    if (!this.domElements.fileTree) return;

    this.domElements.fileTree.innerHTML = `
      ${this.getBreadcrumbs()}
      ${files?.length > 0 ? this.getFileListHTML(files) : this.getEmptyDirectoryHTML()}
    `;
    
    this.setupFileEventListeners(files || []);
  }

  getBreadcrumbs() {
    const parts = this.currentDirectory.split('/').filter(Boolean);
    let path = '';
    
    return `
      <div class="breadcrumbs">
        <a href="#" data-action="go-root">
          <i class="fas fa-home"></i>
        </a>
        ${parts.map(part => {
          path += `${part}/`;
          return `
            <span class="separator">/</span>
            <a href="#" data-path="${path}" data-action="navigate">
              ${part}
            </a>
          `;
        }).join('')}
      </div>
    `;
  }

  getFileListHTML(files) {
    return `
      <ul class="file-list">
        ${files.map(file => `
          <li class="file-item ${file.type}" 
              data-path="${file.path}" 
              data-type="${file.type}"
              title="${file.name}">
            <i class="fas ${file.type === 'directory' ? 'fa-folder text-yellow-400' : 'fa-file-alt'}"></i>
            <span class="name">${file.name}</span>
            ${file.type === 'file' ? `
              <span class="size">${this.formatFileSize(file.size)}</span>
            ` : ''}
          </li>
        `).join('')}
      </ul>
    `;
  }

  getEmptyDirectoryHTML() {
    return `
      <div class="empty-directory">
        <p>This directory is empty</p>
        <div class="actions">
          <button data-action="create-file" class="btn btn-sm btn-success">
            <i class="fas fa-file mr-1"></i> New File
          </button>
          <button data-action="create-folder" class="btn btn-sm btn-primary">
            <i class="fas fa-folder mr-1"></i> New Folder
          </button>
        </div>
      </div>
    `;
  }

  showErrorState(message) {
    if (!this.domElements.fileTree) return;

    this.domElements.fileTree.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
        <button data-action="go-root" class="btn btn-sm btn-secondary">
          <i class="fas fa-home mr-1"></i> Return to Root
        </button>
      </div>
    `;

    this.domElements.fileTree.querySelector('[data-action="go-root"]')
      ?.addEventListener('click', () => this.loadFileTree(''));
  }

  // Event Handling
  setupFileEventListeners(files) {
    // Breadcrumb navigation
    this.domElements.fileTree.querySelectorAll('[data-action="navigate"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadFileTree(link.dataset.path);
      });
    });

    // Root navigation
    this.domElements.fileTree.querySelectorAll('[data-action="go-root"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadFileTree('');
      });
    });

    // Create file/folder buttons
    this.domElements.fileTree.querySelector('[data-action="create-file"]')
      ?.addEventListener('click', () => this.showCreateFileModal());
    this.domElements.fileTree.querySelector('[data-action="create-folder"]')
      ?.addEventListener('click', () => this.showCreateFolderModal());

    // File items
    this.domElements.fileTree.querySelectorAll('.file-item').forEach(item => {
      // Double click to open
      item.addEventListener('dblclick', () => {
        this.handleFileAction(item.dataset.path, item.dataset.type);
      });

      // Right click for context menu
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.selectedItem = {
          path: item.dataset.path,
          type: item.dataset.type,
          name: item.querySelector('.name').textContent
        };
        this.showContextMenu(e.clientX, e.clientY);
      });

      // Click to select
      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
        
        this.domElements.fileTree.querySelectorAll('.file-item').forEach(i => {
          i.classList.remove('selected');
        });
        item.classList.add('selected');
      });
    });
  }

  // File Actions
  handleFileAction(path, type) {
    if (type === 'directory') {
      this.loadFileTree(path);
    } else {
      this.appState.editorManager?.openFileForEditing(path);
    }
  }

  // Context Menu
  showContextMenu(x, y) {
    if (!this.selectedItem || !this.domElements.contextMenu) return;
    
    this.domElements.contextMenu.innerHTML = `
      <li data-action="context-open">
        <i class="fas fa-folder-open"></i> Open
      </li>
      <li data-action="context-rename">
        <i class="fas fa-edit"></i> Rename
      </li>
      <li data-action="context-delete">
        <i class="fas fa-trash"></i> Delete
      </li>
      ${this.selectedItem.type === 'file' ? `
        <li data-action="context-download">
          <i class="fas fa-download"></i> Download
        </li>
        <li data-action="context-preview">
          <i class="fas fa-eye"></i> Preview
        </li>
      ` : ''}
      <li data-action="context-copy-path">
        <i class="fas fa-copy"></i> Copy Path
      </li>
      <li data-action="context-properties">
        <i class="fas fa-info-circle"></i> Properties
      </li>
    `;

    // Add event listeners
    const actions = {
      'context-open': () => this.handleFileAction(this.selectedItem.path, this.selectedItem.type),
      'context-rename': () => this.showRenameModal(),
      'context-delete': () => this.showDeleteConfirmation(),
      'context-download': () => this.downloadFile(this.selectedItem.path),
      'context-preview': () => this.previewFile(this.selectedItem.path),
      'context-copy-path': () => this.copyPath(this.selectedItem.path),
      'context-properties': () => this.showProperties()
    };

    Object.entries(actions).forEach(([action, handler]) => {
      this.domElements.contextMenu.querySelector(`[data-action="${action}"]`)
        ?.addEventListener('click', handler);
    });

    // Position the menu
    const menuWidth = this.domElements.contextMenu.offsetWidth;
    const menuHeight = this.domElements.contextMenu.offsetHeight;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

    this.domElements.contextMenu.style.left = `${adjustedX}px`;
    this.domElements.contextMenu.style.top = `${adjustedY}px`;
    this.domElements.contextMenu.classList.add('visible');
  }

  hideContextMenu() {
    this.domElements.contextMenu?.classList.remove('visible');
  }

  // File Operations
  async uploadFiles(files, targetPath = this.currentDirectory) {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('path', targetPath);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(await response.text() || 'Upload failed');

      this.appState.notificationManager?.showNotification(
        `Successfully uploaded ${files.length} file(s)`, 
        'success'
      );
      this.refreshFileTree();
    } catch (error) {
      this.appState.notificationManager?.showNotification(
        `Upload failed: ${error.message}`, 
        'error'
      );
    }
  }

  handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) this.uploadFiles(files);
  }

  async downloadFile(filePath) {
    try {
      const response = await fetch(`/api/download?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) throw new Error(await response.text() || 'Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      this.appState.notificationManager?.showNotification(
        `Download failed: ${error.message}`, 
        'error'
      );
    }
  }

  copyPath(path) {
    navigator.clipboard.writeText(path).then(() => {
      this.appState.notificationManager?.showNotification('Path copied to clipboard', 'success');
    }).catch(err => {
      console.error('Failed to copy path:', err);
      this.appState.notificationManager?.showNotification('Failed to copy path', 'error');
    });
  }

  copyCurrentPath() {
    this.copyPath(this.currentDirectory || '/');
  }

  // Modals
  showCreateFileModal() {
    if (!this.domElements.fileName || !this.domElements.fileTemplate || !this.domElements.fileCustomContent) return;
    
    this.domElements.fileName.value = '';
    this.domElements.fileTemplate.value = 'empty';
    this.domElements.fileCustomContent.value = '';
    this.appState.modalManager?.openModal('createFileModal');
  }

  showCreateFolderModal() {
    if (!this.domElements.folderName) return;
    this.domElements.folderName.value = '';
    this.appState.modalManager?.openModal('createFolderModal');
  }

  showRenameModal() {
    if (!this.selectedItem || !this.domElements.renameModal || !this.domElements.renameInput) return;
    
    this.domElements.renameInput.value = this.selectedItem.name;
    this.domElements.renameModal.dataset.path = this.selectedItem.path;
    this.domElements.renameModal.dataset.type = this.selectedItem.type;
    this.appState.modalManager?.openModal('renameModal');
  }

  showDeleteConfirmation() {
    if (!this.selectedItem || !this.domElements.deleteModal) return;
    
    const nameElement = this.domElements.deleteModal.querySelector('.item-name');
    if (nameElement) nameElement.textContent = this.selectedItem.name;
    this.domElements.deleteModal.dataset.path = this.selectedItem.path;
    this.domElements.deleteModal.dataset.type = this.selectedItem.type;
    this.appState.modalManager?.openModal('deleteModal');
  }

  // CRUD Operations
  async createNewFile() {
    if (!this.domElements.fileName || !this.domElements.fileTemplate || !this.domElements.fileCustomContent) return;

    const fileName = this.domElements.fileName.value.trim();
    const template = this.domElements.fileTemplate.value;
    const customContent = this.domElements.fileCustomContent.value;
    const filePath = `${this.currentDirectory}/${fileName}`;

    if (!fileName) {
      this.appState.notificationManager?.showNotification('Please enter a file name', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          template,
          content: customContent
        })
      });

      if (!response.ok) throw new Error(await response.text() || 'File creation failed');

      this.appState.notificationManager?.showNotification('File created successfully', 'success');
      this.appState.modalManager?.closeModal('createFileModal');
      this.refreshFileTree();
      
      // Open the file if it's a text file
      if (/\.(js|jsx|ts|tsx|html|css|json|txt)$/.test(fileName)) {
        this.appState.editorManager?.openFileForEditing(filePath);
      }
    } catch (error) {
      this.appState.notificationManager?.showNotification(
        `Failed to create file: ${error.message}`, 
        'error'
      );
    }
  }

  async createNewFolder() {
    if (!this.domElements.folderName) return;

    const folderName = this.domElements.folderName.value.trim();
    const folderPath = `${this.currentDirectory}/${folderName}`;

    if (!folderName) {
      this.appState.notificationManager?.showNotification('Please enter a folder name', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });

      if (!response.ok) throw new Error(await response.text() || 'Folder creation failed');

      this.appState.notificationManager?.showNotification('Folder created successfully', 'success');
      this.appState.modalManager?.closeModal('createFolderModal');
      this.refreshFileTree();
    } catch (error) {
      this.appState.notificationManager?.showNotification(
        `Failed to create folder: ${error.message}`, 
        'error'
      );
    }
  }

  async renameItem() {
    if (!this.domElements.renameModal || !this.domElements.renameInput) return;

    const newName = this.domElements.renameInput.value.trim();
    const oldPath = this.domElements.renameModal.dataset.path;
    const type = this.domElements.renameModal.dataset.type;

    if (!newName) {
      this.appState.notificationManager?.showNotification(
        `Please enter a new ${type === 'file' ? 'file' : 'folder'} name`, 
        'warning'
      );
      return;
    }

    const newPath = oldPath.replace(/[^/]+$/, newName);

    try {
      const response = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });

      if (!response.ok) throw new Error(await response.text() || 'Rename failed');

      this.appState.notificationManager?.showNotification(
        `${type === 'file' ? 'File' : 'Folder'} renamed successfully`, 
        'success'
      );
      this.appState.modalManager?.closeModal('renameModal');
      this.refreshFileTree();
    } catch (error) {
      this.appState.notificationManager?.showNotification(
        `Failed to rename ${type}: ${error.message}`, 
        'error'
      );
    }
  }

  async deleteItem() {
    if (!this.domElements.deleteModal) return;

    const path = this.domElements.deleteModal.dataset.path;
    const type = this.domElements.deleteModal.dataset.type;

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      if (!response.ok) throw new Error(await response.text() || 'Deletion failed');

      this.appState.notificationManager?.showNotification(
        `${type === 'file' ? 'File' : 'Folder'} deleted successfully`, 
        'success'
      );
      this.appState.modalManager?.closeModal('deleteModal');
      this.refreshFileTree();
    } catch (error) {
      this.appState.notificationManager?.showNotification(
        `Failed to delete ${type}: ${error.message}`, 
        'error'
      );
    }
  }

  // Utility Methods
  async fetchWithErrorHandling(url, errorMessage) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text() || errorMessage);
    return response;
  }

  handleError(context, error) {
    console.error(context, error);
    this.showErrorState(error.message);
    this.appState.notificationManager?.showNotification(
      `Error: ${error.message}`,
      'error'
    );
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Stub methods for unimplemented features
  startUpload() {
    this.domElements.fileUpload?.click();
  }

  handleFileSelect(files) {
    if (files.length > 0) this.uploadFiles(Array.from(files));
  }

  previewFile(path) {
    this.appState.notificationManager?.showNotification('Preview not implemented yet', 'info');
  }

  showProperties() {
    this.appState.notificationManager?.showNotification('Properties not implemented yet', 'info');
  }
}

export { FileManager };