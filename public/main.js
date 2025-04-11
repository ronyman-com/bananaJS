/**
 * BananaJS Main Entry Point
 * 
 * This file serves as the primary JavaScript entry point for the application.
 * It initializes the environment, sets up error handling, and loads the appropriate
 * framework based on the page requirements.
 */

// Environment setup
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// Error handling setup
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (isDevelopment) {
    showErrorOverlay(event.error);
  }
});

// Framework detection and initialization
function initializeApp() {
  // Check if we're on a Vue page
  if (document.querySelector('[data-vue-app]')) {
    initializeVueApp();
  }
  // Check if we're on a React page
  else if (document.querySelector('[data-react-root]')) {
    initializeReactApp();
  }
  // Default behavior for static pages
  else {
    initializeStaticPage();
  }
}

// Vue.js initialization
function initializeVueApp() {
  if (isDevelopment) {
    console.log('Initializing Vue app in development mode');
  }

  import('vue').then(({ createApp }) => {
    const appModule = import('../src/App.vue');
    const routerModule = import('../src/router');

    Promise.all([appModule, routerModule]).then(([App, router]) => {
      const app = createApp(App.default);
      app.use(router.default);
      app.mount('[data-vue-app]');
    });
  }).catch(error => {
    console.error('Vue initialization failed:', error);
  });
}

// React initialization
function initializeReactApp() {
  if (isDevelopment) {
    console.log('Initializing React app in development mode');
  }

  import('react').then((React) => {
    import('react-dom/client').then(({ createRoot }) => {
      const App = import('../src/App.jsx');
      const Router = import('../src/router');

      Promise.all([App, Router]).then(([AppComponent, router]) => {
        const rootElement = document.querySelector('[data-react-root]');
        const root = createRoot(rootElement);
        root.render(
          React.createElement(router.BrowserRouter, null,
            React.createElement(AppComponent.default)
          )
        );
      });
    });
  }).catch(error => {
    console.error('React initialization failed:', error);
  });
}

// Static page initialization
function initializeStaticPage() {
  // Common functionality for all static pages
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize any common components
    initializeNavigation();
    initializeAnalytics();
    
    // Page-specific initialization
    if (document.querySelector('.dashboard-page')) {
      initializeDashboard();
    }
  });
}

// Dashboard-specific functionality
function initializeDashboard() {
  console.log('Initializing dashboard functionality');
  
  // Connect to WebSocket for live updates
  const socket = new WebSocket(`wss://${window.location.host}/ws`);
  
  socket.addEventListener('open', () => {
    console.log('Connected to dashboard WebSocket');
  });
  
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      handleDashboardUpdate(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  // Handle dashboard updates
  function handleDashboardUpdate(data) {
    if (data.type === 'metrics') {
      updateMetricsDisplay(data.payload);
    } else if (data.type === 'file-change') {
      showFileChangeNotification(data.file);
    }
  }
  
  // Update metrics display
  function updateMetricsDisplay(metrics) {
    const elements = {
      memory: document.getElementById('memory-usage'),
      cpu: document.getElementById('cpu-usage'),
      buildTime: document.getElementById('build-time'),
      hmrTime: document.getElementById('hmr-time')
    };
    
    for (const [key, element] of Object.entries(elements)) {
      if (element && metrics[key] !== undefined) {
        element.textContent = formatMetric(key, metrics[key]);
      }
    }
  }
  
  // Format metric values for display
  function formatMetric(type, value) {
    switch (type) {
      case 'memory':
        return `${(value / 1024 / 1024).toFixed(2)} MB`;
      case 'cpu':
        return `${value.toFixed(2)}%`;
      case 'buildTime':
      case 'hmrTime':
        return `${value} ms`;
      default:
        return value;
    }
  }
}

// Common UI components initialization
function initializeNavigation() {
  // Mobile menu toggle
  const menuToggle = document.getElementById('mobile-menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const menu = document.getElementById('mobile-menu');
      menu.classList.toggle('hidden');
    });
  }
  
  // Active link highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

// Analytics initialization
function initializeAnalytics() {
  if (isProduction) {
    // Initialize production analytics (e.g., Google Analytics)
    console.log('Initializing production analytics');
  } else {
    console.log('Running in development mode - analytics disabled');
  }
}

// Development error overlay
function showErrorOverlay(error) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.padding = '1rem';
  overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  overlay.style.color = 'white';
  overlay.style.zIndex = '9999';
  overlay.style.fontFamily = 'monospace';
  
  overlay.innerHTML = `
    <div><strong>Error:</strong> ${error.message}</div>
    <div><strong>Stack:</strong> ${error.stack}</div>
    <button style="margin-top: 1rem; padding: 0.5rem; background: white; color: black;">
      Dismiss
    </button>
  `;
  
  overlay.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });
  
  document.body.appendChild(overlay);
}

// Start the application
initializeApp();

// Export for testing purposes
if (isDevelopment) {
  window.__bananajs = {
    initializeApp,
    initializeVueApp,
    initializeReactApp,
    initializeStaticPage,
    initializeDashboard
  };
}