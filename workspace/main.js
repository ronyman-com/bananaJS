// bananaJS/main.js
import { createApp } from 'vue';
import App from './App.vue';
import './public/styles/main.css';

// Initialize WebSocket connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    showNotification('Connected to live updates', 'success');
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'metrics') {
        updateMetrics(message.data);
      } else if (message.type === 'file-change') {
        showNotification(`File changed: ${message.file}`, 'info');
        refreshFileTree();
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    showNotification('Disconnected from live updates', 'error');
    setTimeout(initWebSocket, 5000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}

// Global variables
let currentDirectory = '';
let ws = initWebSocket();

// Safely update metrics display
function updateMetrics(data) {
  try {
    const memoryElement = document.getElementById('memory');
    const cpuElement = document.getElementById('cpu');
    const buildTimeElement = document.getElementById('build-time');
    const hmrUpdateTimeElement = document.getElementById('hmr-update-time');
    
    if (memoryElement) memoryElement.textContent = data.memory?.toFixed(2) || '0';
    if (cpuElement) cpuElement.textContent = data.cpu?.toFixed(2) || '0';
    if (buildTimeElement) buildTimeElement.textContent = data.buildTime || '0';
    if (hmrUpdateTimeElement) hmrUpdateTimeElement.textContent = data.hmrUpdateTime || '0';
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}

// Show notification with safety checks
function showNotification(message, type = 'info') {
  try {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Fetch and display the file tree with error handling
async function loadFileTree(directory = '') {
  try {
    currentDirectory = directory;
    const currentPathElement = document.getElementById('current-path');
    if (currentPathElement) {
      currentPathElement.textContent = `Current path: ${directory || '/'}`;
    }
    
    const encodedDir = encodeURIComponent(directory);
    const response = await fetch(`/api/files?directory=${encodedDir}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const files = await response.json();
    renderFileTree(files);
  } catch (error) {
    console.error('Error loading file tree:', error);
    showNotification(`Error loading directory: ${error.message}`, 'error');
    const fileTree = document.getElementById('file-tree');
    if (fileTree) {
      fileTree.innerHTML = `
        <li style="color: #f44336">
          Error loading directory: ${error.message}
          <button onclick="loadFileTree('')" style="margin-left: 10px; font-size: 12px;">
            Return to root
          </button>
        </li>
      `;
    }
  }
}

// Render the file tree with safety checks
function renderFileTree(files) {
  try {
    const fileTree = document.getElementById('file-tree');
    if (!fileTree) return;
    
    if (!files || files.length === 0) {
      fileTree.innerHTML = '<li style="color: #aaa;">Empty directory</li>';
      return;
    }
    
    fileTree.innerHTML = files.map(file => `
      <li class="${file.isDirectory ? 'folder' : 'file'}" 
          data-path="${file.path || file.name}">
        <span class="item-name">${file.name}</span>
        ${file.isDirectory ? '<span class="file-actions">Open</span>' : ''}
      </li>
    `).join('');
    
    // Add click handlers safely
    document.querySelectorAll('.folder').forEach(folder => {
      folder.addEventListener('click', (e) => {
        if (e.target.classList.contains('file-actions')) return;
        const folderName = folder.querySelector('.item-name')?.textContent;
        if (folderName) {
          const newPath = currentDirectory ? `${currentDirectory}/${folderName}` : folderName;
          loadFileTree(newPath);
        }
      });
    });
  } catch (error) {
    console.error('Error rendering file tree:', error);
  }
}

// Refresh file tree
function refreshFileTree() {
  loadFileTree(currentDirectory);
}

// Theme toggle logic
function setupThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    body.classList.add(savedTheme);
    themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }

  themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDarkMode = body.classList.contains('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
    console.log('Theme toggled:', isDarkMode ? 'Dark' : 'Light');
  });
}

// Initialize application
function initApp() {
  // Print the current year
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Fetch GitHub stars
  fetch('https://api.github.com/repos/ronyman-com/bananaJS')
    .then(response => response.json())
    .then(data => {
      document.getElementById('github-stars').textContent = data.stargazers_count;
    })
    .catch(error => {
      console.error('Error fetching GitHub stars:', error);
      document.getElementById('github-stars').textContent = 'Error loading stars';
    });

  setupThemeToggle();
  loadFileTree();
}

// Create and mount the Vue app
const app = createApp(App);

// Add global methods to the app instance
app.config.globalProperties.$showNotification = showNotification;
app.config.globalProperties.$loadFileTree = loadFileTree;
app.config.globalProperties.$updateMetrics = updateMetrics;

// Mount the app
app.mount('#app');

// Initialize the application after mount
document.addEventListener('DOMContentLoaded', initApp);