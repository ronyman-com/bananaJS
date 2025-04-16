import { AppState } from "./app-state.js";

class ModalManager {
    constructor(appState) {
        this.appState = appState;
        this.currentOpenModal = null;
        
        // Cache DOM elements
        this.domElements = {
            overlay: document.getElementById('modal-overlay'),
            cliOutput: document.getElementById('cli-output'),
            modals: {
                createProject: document.getElementById('createProjectModal'),
                createApp: document.getElementById('createAppModal'),
                createFile: document.getElementById('createFileModal'),
                createFolder: document.getElementById('createFolderModal'),
                upload: document.getElementById('uploadModal')
            }
        };
        
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('click', (e) => {
            // Handle modal close buttons
            if (e.target.classList.contains('modal-close')) {
                this.closeModal(this.currentOpenModal);
            }
            
            // Close modal when clicking on overlay
            if (e.target === this.domElements.overlay) {
                this.closeModal(this.currentOpenModal);
            }
        });
        
        // Add ESC key listener to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentOpenModal) {
                this.closeModal(this.currentOpenModal);
            }
        });
    }

    openModal(id) {
        this.domElements.overlay.style.display = 'block';
        document.getElementById(id).style.display = 'block';
        this.currentOpenModal = id;
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    closeModal(id) {
        this.domElements.overlay.style.display = 'none';
        
        if (id) {
            document.getElementById(id).style.display = 'none';
            
            // Reset form if exists
            const form = document.querySelector(`#${id} form`);
            if (form) form.reset();
        }
        
        this.currentOpenModal = null;
        document.body.style.overflow = ''; // Re-enable scrolling
    }

    // Convenience methods for specific modals
    openCreateProjectModal() {
        this.openModal('createProjectModal');
    }

    openCreateAppModal() {
        this.openModal('createAppModal');
    }

    showCreateFileModal() {
        this.openModal('createFileModal');
    }

    showCreateFolderModal() {
        this.openModal('createFolderModal');
    }

    showUploadModal() {
        this.openModal('uploadModal');
    }

    // Utility methods
    validateInput(input, fieldName) {
        if (!input || !input.trim()) {
            this.appState.notificationManager.showNotification(`Please enter a ${fieldName}.`, 'warning');
            return false;
        }
        return true;
    }

    showLoading(modalId, show = true) {
        const loader = document.querySelector(`#${modalId} .modal-loader`);
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    // Project creation
    async createProjectWithCLI() {
        const projectName = document.getElementById('projectName').value;
        const initGit = document.getElementById('initGit').checked;
        const useYarn = document.getElementById('useYarn').checked;
        const projectTemplate = document.getElementById('projectTemplate').value;
        
        if (!this.validateInput(projectName, 'project name')) return;

        this.domElements.cliOutput.classList.remove('hidden');
        this.domElements.cliOutput.textContent = 'Creating project... please wait.\n';
        this.showLoading('createProjectModal', true);

        try {
            const response = await fetch('/api/create-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName: projectName,
                    initGit: initGit,
                    useYarn: useYarn,
                    template: projectTemplate
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create project');
            }

            this.domElements.cliOutput.textContent += '\nProject created successfully!\n';
            this.domElements.cliOutput.textContent += 'You may need to restart the server for changes to take full effect.';
            
            // Show any warnings from server
            if (result.warnings) {
                result.warnings.forEach(warning => {
                    this.appState.notificationManager.showNotification(warning, 'warning');
                });
            }
            
            this.appState.notificationManager.showNotification('Project created successfully!', 'success');
        } catch (error) {
            this.domElements.cliOutput.textContent += `\nError: Failed to create project. Please check the name and try again.`;
            console.error('Project creation error:', error);
            this.appState.notificationManager.showNotification(
                `Project creation failed: ${error.message}`, 
                'error'
            );
        } finally {
            this.showLoading('createProjectModal', false);
        }
    }

    // App creation
    async createApp() {
        const appName = document.getElementById('appName').value;
        const appTemplate = document.getElementById('appTemplate').value;

        if (!this.validateInput(appName, 'app name')) return;

        this.showLoading('createAppModal', true);

        try {
            const response = await fetch('/api/create-app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appName: appName, template: appTemplate })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create app');
            }

            // Show any warnings from server
            if (result.warnings) {
                result.warnings.forEach(warning => {
                    this.appState.notificationManager.showNotification(warning, 'warning');
                });
            }

            this.appState.notificationManager.showNotification('App created successfully', 'success');
            this.closeModal('createAppModal');
            
            // Refresh file tree
            if (this.appState.fileManager) {
                this.appState.fileManager.loadFileTree(this.appState.fileManager.currentDirectory);
            }
        } catch (error) {
            console.error('App creation error:', error);
            this.appState.notificationManager.showNotification(
                `Failed to create app: ${error.message}`,
                'error'
            );
        } finally {
            this.showLoading('createAppModal', false);
        }
    }
}

export { ModalManager };