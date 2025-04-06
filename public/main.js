// Import Vue
import { createApp } from 'vue';
import App from './App.vue'; // Import your root Vue component

// Create and mount the Vue app
const app = createApp(App);
app.mount('#app');

// WebSocket client for HMR
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'update') {
    console.log(`File changed: ${message.file}`);
    // Reload the page or update specific modules
    window.location.reload();
  }

  if (message.type === 'metrics') {
    console.log('Performance metrics:', message.data);
    // Display metrics in the UI (e.g., update a dashboard)
  }
};

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};