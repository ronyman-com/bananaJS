// js/websocket-manager.js
import { AppState } from "./app-state.js";

class WebSocketManager {
  constructor(appState) {
    this.app = appState;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.connectionTimeout = null;
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    this.heartbeatTimeout = 15000; // 15 seconds
  }

  initWebSocket() {
    console.log('Initializing WebSocket connection...');
    this.cleanupWebSocket();

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      // Try both with and without port for development/production
      const wsUrl = window.location.port 
        ? `${protocol}${window.location.hostname}:${window.location.port}/ws`
        : `${protocol}${window.location.hostname}/ws`;

      console.log(`Connecting to WebSocket at: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      // Add binaryType if needed
      this.ws.binaryType = 'arraybuffer';

      this.setupEventHandlers();
      this.startConnectionTimeout();
      
      // Debugging help
      window.debugWs = this.ws;
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      this.handleInitializationError(error);
      
      // Fallback to polling if WebSocket fails
      if (this.reconnectAttempts === 0) {
        this.app.notificationManager.showNotification(
          'Real-time updates unavailable. Using fallback mode.',
          'warning'
        );
      }
    }
  }

  // Add this new method
  setupEventHandlers() {
    this.ws.onopen = (event) => {
      console.log('WebSocket open event:', event);
      this.handleWebSocketOpen();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error event:', error);
      this.handleWebSocketError(error);
    };

    // ... rest of the handlers
  }

  setupEventHandlers() {
    this.ws.onopen = this.handleWebSocketOpen.bind(this);
    this.ws.onmessage = this.handleWebSocketMessage.bind(this);
    this.ws.onclose = this.handleWebSocketClose.bind(this);
    this.ws.onerror = this.handleWebSocketError.bind(this);
  }

  startConnectionTimeout() {
    this.connectionTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        this.handleConnectionTimeout();
      }
    }, 5000);
  }

  cleanupWebSocket() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(1000, 'Cleanup');
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      
      this.ws = null;
    }
    
    clearTimeout(this.connectionTimeout);
    this.stopHeartbeat();
    
  }

  handleInitializationError(error) {
    this.app.notificationManager.showNotification(
      'Failed to initialize WebSocket connection', 
      'error'
    );
    this.updateConnectionStatus('failed');
    this.scheduleReconnect();
  }

  handleWebSocketOpen() {
    clearTimeout(this.connectionTimeout);
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.updateConnectionStatus('connected');
    console.log('WebSocket connected successfully');
    this.app.notificationManager.showNotification('Connected to HMR server', 'success');
  }

  startHeartbeat() {
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 10000); // Send ping every 10 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  checkHeartbeat() {
    if (Date.now() - this.lastHeartbeat > this.heartbeatTimeout) {
      console.warn('Heartbeat timeout - forcing reconnect');
      this.cleanupWebSocket();
      this.scheduleReconnect();
    }
  }

  handleConnectionTimeout() {
    console.warn('WebSocket connection timeout');
    this.cleanupWebSocket();
    this.updateConnectionStatus('timeout');
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionStatus('failed');
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds delay
    );

    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    this.updateConnectionStatus('reconnecting', this.reconnectAttempts + 1);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.initWebSocket();
    }, delay);
  }

  updateConnectionStatus(status, attempt = 0) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;

    const statusConfig = {
      connected: {
        message: 'Connected to HMR server',
        icon: 'fas fa-check-circle',
        classes: 'bg-green-100 text-green-800'
      },
      reconnecting: {
        message: `Connecting to HMR server... (reconnecting ${attempt}/${this.maxReconnectAttempts})`,
        icon: 'fas fa-sync-alt fa-spin',
        classes: 'bg-yellow-100 text-yellow-800'
      },
      timeout: {
        message: 'Connection timeout',
        icon: 'fas fa-exclamation-triangle',
        classes: 'bg-red-100 text-red-800'
      },
      failed: {
        message: 'Failed to connect to HMR server',
        icon: 'fas fa-times-circle',
        classes: 'bg-red-100 text-red-800'
      },
      default: {
        message: 'Connecting to HMR server...',
        icon: 'fas fa-circle-notch fa-spin',
        classes: 'bg-yellow-100 text-yellow-800'
      }
    };

    const config = statusConfig[status] || statusConfig.default;
    statusElement.innerHTML = `<i class="${config.icon} mr-2"></i><span>${config.message}</span>`;
    statusElement.className = `p-3 mb-4 rounded flex items-center ${config.classes}`;
  }

  handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.lastHeartbeat = Date.now(); // Update heartbeat timestamp

      if (message.type === 'pong') {
        return; // Just a heartbeat response
      }

      console.debug('WebSocket message received:', message);
      this.processWebSocketMessage(message);
    } catch (error) {
      console.error('Error processing message:', error, 'Raw data:', event.data);
      this.app.notificationManager.showNotification('Error processing server message', 'error');
    }
  }

  processWebSocketMessage(message) {
    if (!message || typeof message !== 'object') {
      console.error('Invalid message format:', message);
      return;
    }

    const handlers = {
      'hmr-update': () => this.handleHmrUpdate(message.updates),
      'build-status': () => this.handleBuildStatus(message),
      'server-status': () => this.handleServerStatus(message),
      'terminal-output': () => this.handleTerminalOutput(message.output),
      'file-change': () => this.handleFileChange(message),
      'system-metrics': () => this.handleSystemMetrics(message)
    };

    if (handlers[message.type]) {
      handlers[message.type]();
    } else {
      console.log('Unhandled message type:', message.type, message);
    }
  }

  handleHmrUpdate(updates) {
    console.log('HMR Update received:', updates);
    this.app.notificationManager.showNotification(
      `HMR updated ${updates.length} modules`, 
      'info'
    );
    // Additional HMR logic would go here
  }

  handleBuildStatus(status) {
    console.log('Build Status:', status);
    this.updateBuildInfo(status);
    this.app.notificationManager.showNotification(
      `Build ${status.status.toLowerCase()} in ${status.buildTime}ms`,
      status.status === 'Success' ? 'success' : 'error'
    );
  }

  updateBuildInfo(status) {
    const elements = {
      'build-time': `${status.buildTime} ms`,
      'hmr-update-time': status.hmrTime ? `${status.hmrTime} ms` : '-- ms',
      'project-size': status.projectSize || '--',
      'files-count': status.filesCount || '--'
    };

    Object.entries(elements).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    });
  }

  handleServerStatus(status) {
    console.log('Server Status:', status);
    // Update UI based on server status
  }

  handleTerminalOutput(output) {
    if (this.app.terminalManager?.terminal) {
      this.app.terminalManager.terminal.write(output);
    }
  }

  handleFileChange(change) {
    console.log('File change detected:', change);
    if (this.app.fileManager) {
      this.app.fileManager.handleExternalFileChange(change);
    }
  }

  handleSystemMetrics(metrics) {
    console.log('System metrics:', metrics);
    // Update system resource displays
  }

  handleWebSocketClose(event) {
    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
    this.stopHeartbeat();

    if (event.code === 1000) {
      // Normal closure
      this.updateConnectionStatus('disconnected');
      return;
    }

    this.updateConnectionStatus('reconnecting');
    this.scheduleReconnect();
  }

  handleWebSocketError(error) {
    console.error('WebSocket error:', error);
    this.app.notificationManager.showNotification('WebSocket connection error', 'error');
    this.updateConnectionStatus('failed');
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  }
}

export { WebSocketManager };