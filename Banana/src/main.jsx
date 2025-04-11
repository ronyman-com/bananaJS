import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from './router';
import './styles/main.css';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  
  if (!container) {
    console.error('Root element not found');
    return;
  }

  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>
  );

  // Hide loading screen
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 300);
  }
  
});