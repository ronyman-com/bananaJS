// js/app-init.js
import { AppState } from "./app-state.js";

// Connection status constants
const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

document.addEventListener('DOMContentLoaded', () => {
  // Check WebSocket support
  if (!window.WebSocket) {
    showFatalError('WebSocket not supported in this browser');
    return;
  }

  try {
    // Initialize application state
    window.appState = new AppState();
    
    // Set up connection status monitoring
    setupConnectionMonitoring();
    
    // Initialize the application
    window.appState.init();
    
    // Add reconnect button
    addReconnectButton();
    
  } catch (error) {
    showFatalError(`Application failed to initialize: ${error.message}`);
    console.error('Initialization error:', error);
  }
});

function setupConnectionMonitoring() {
  if (!window.appState) return;

  // Listen for connection state changes
  window.appState.onConnectionStateChange = (state) => {
    updateConnectionStatusUI(state);
  };

  // Initial status update
  updateConnectionStatusUI(
    window.appState.isConnected ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED
  );
}

function updateConnectionStatusUI(state) {
  const statusElement = document.getElementById('connection-status');
  if (!statusElement) return;

  switch (state) {
    case CONNECTION_STATUS.CONNECTED:
      statusElement.innerHTML = `
        <i class="fas fa-check-circle mr-2"></i>
        <span>Connected to HMR server</span>
      `;
      statusElement.className = 'p-3 mb-4 rounded bg-green-100 text-green-800';
      break;
      
    case CONNECTION_STATUS.DISCONNECTED:
      statusElement.innerHTML = `
        <i class="fas fa-sync-alt fa-spin mr-2"></i>
        <span>Connecting to HMR server...</span>
      `;
      statusElement.className = 'p-3 mb-4 rounded bg-yellow-100 text-yellow-800';
      break;
      
    case CONNECTION_STATUS.ERROR:
      statusElement.innerHTML = `
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <span>Connection error</span>
      `;
      statusElement.className = 'p-3 mb-4 rounded bg-red-100 text-red-800';
      break;
  }
}

function addReconnectButton() {
  const statusElement = document.getElementById('connection-status');
  if (!statusElement || !window.appState) return;

  const reconnectBtn = document.createElement('button');
  reconnectBtn.className = 'ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded';
  reconnectBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Reconnect';
  reconnectBtn.onclick = async () => {
    console.log('Manual reconnect triggered');
    try {
      await window.appState.reconnectWebSocket();
    } catch (error) {
      console.error('Reconnect failed:', error);
      updateConnectionStatusUI(CONNECTION_STATUS.ERROR);
    }
  };
  statusElement.appendChild(reconnectBtn);
}

function showFatalError(message) {
  console.error(message);
  const errorElement = document.createElement('div');
  errorElement.className = 'p-4 bg-red-100 text-red-800';
  errorElement.innerHTML = `
    <i class="fas fa-exclamation-triangle mr-2"></i>
    <span>${message}</span>
  `;
  document.body.prepend(errorElement);
}