import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from './router';

const root = createRoot(document.getElementById('app'));

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