// js/app-state.js
import { WebSocketManager } from './websocket-manager.js';
import { NotificationManager } from './notifications.js'
import { FileManager } from './file-manager.js';


const CONNECTION_STATUS = {

  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error'
};

class AppState {
  constructor() {
    this.onConnectionStateChange = null;
    this._isConnected = false;
    this.notificationManager = null;
    this.fileManager = null;
    this.terminalManager = null;
    this.editorManager = null;
    this.modalManager = null;
    this.websocketManager = null;
    
    // WebSocket state
    this.connectionStatus = CONNECTION_STATUS.DISCONNECTED;
    this.reconnectAttempts = 0;
  }

  get isConnected() {
    return this._isConnected;
  }

  get connectionState() {
    return this.connectionStatus;
  }

  async init() {
    // Initialize all managers
    this.websocketManager = new WebSocketManager(this);
    await this.websocketManager.initWebSocket();
    
    // Initialize other managers
    this.notificationManager = new NotificationManager();
    this.fileManager = new FileManager(this);
    // ... etc
  }

  async reconnectWebSocket() {
    try {
      this._updateConnectionState(CONNECTION_STATUS.CONNECTING);
      await this.websocketManager.reconnect();
      return true;
    } catch (error) {
      console.error('Reconnect failed:', error);
      this._updateConnectionState(CONNECTION_STATUS.ERROR);
      throw error;
    }
  }

  _updateConnectionState(state) {
    this.connectionStatus = state;
    this._isConnected = state === CONNECTION_STATUS.CONNECTED;
    
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(state);
    }
    
    // Update UI if needed
    if (this.websocketManager) {
      this.websocketManager.updateConnectionStatus(state, this.reconnectAttempts);
    }
  }

  // WebSocket event handlers
  handleWebSocketOpen() {
    this.reconnectAttempts = 0;
    this._updateConnectionState(CONNECTION_STATUS.CONNECTED);
    this.notificationManager?.showNotification('WebSocket connected', 'success');
  }

  handleWebSocketClose(event) {
    if (event.wasClean) {
      this._updateConnectionState(CONNECTION_STATUS.DISCONNECTED);
    } else {
      this._updateConnectionState(CONNECTION_STATUS.ERROR);
      this.scheduleReconnect();
    }
  }

  handleWebSocketError(error) {
    this._updateConnectionState(CONNECTION_STATUS.ERROR);
    console.error('WebSocket error:', error);
    this.notificationManager?.showNotification('WebSocket error', 'error');
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      if (this.connectionStatus !== CONNECTION_STATUS.CONNECTED) {
        this.reconnectWebSocket();
      }
    }, delay);
  }


  showTerminal() {
    this.terminalManager.showTerminal();
  }

  hideTerminal() {
    this.terminalManager.hideTerminal();
  }
}

export { AppState, CONNECTION_STATUS };