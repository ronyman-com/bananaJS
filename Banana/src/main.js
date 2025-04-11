// Banana/src/main.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from './router';
import './styles/main.css';

// Initialize the app
function initApp() {
  // Create root element
  const container = document.getElementById('app');
  
  // Check if root element exists
  if (!container) {
    console.error('Root element with id "app" not found');
    return;
  }

  // Create root
  const root = createRoot(container);

  // Render the app
  root.render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>
  );

  // Service worker registration (for PWA)
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
}

// Initialize analytics (optional)
function initAnalytics() {
  if (process.env.NODE_ENV === 'production') {
    // Initialize your analytics tool here
    console.log('Analytics initialized');
  }
}

// Error handling
function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    // You can add error reporting here
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // You can add error reporting here
  });
}

// App startup
function startApp() {
  setupErrorHandling();
  initAnalytics();
  initApp();
}

// Start the application
startApp();