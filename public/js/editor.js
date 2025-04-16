import { AppState } from "./app-state.js";

    class EditorManager {
        constructor(appState) {
          this.appState = appState;
          this.codeEditor = null;
          this.currentFile = null;
        }

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

              this.currentFile = filePath;
            }
          } catch (error) {
            this.appState.notificationManager.showNotification(`Error opening file: ${error.message}`, 'error');
          }
        }

        getLanguageFromExtension(filePath) {
          const extension = filePath.split('.').pop().toLowerCase();
          switch (extension) {
            case 'js': return 'javascript';
            case 'ts': return 'typescript';
            case 'json': return 'json';
            case 'html': return 'html';
            case 'css': return 'css';
            // Add more language mappings as needed
            default: return 'plaintext';
          }
        }

        async saveCurrentFile() {
          if (!this.currentFile) {
            this.appState.notificationManager.showNotification('No file opened to save.', 'warning');
            return;
          }

          const content = this.codeEditor.getValue();
          try {
            const response = await fetch('/api/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ path: this.currentFile, content: content })
            });

            if (!response.ok) {
              throw new Error(await response.text() || 'Failed to save file');
            }

            this.appState.notificationManager.showNotification('File saved successfully', 'success');
            document.getElementById('editor-status').classList.add('hidden');
          } catch (error) {
            this.appState.notificationManager.showNotification(`Error saving file: ${error.message}`, 'error');
          }
        }

        closeEditor() {
          document.getElementById('editor-container').classList.add('hidden');
          this.currentFile = null;
        }
      }
      export { EditorManager };
