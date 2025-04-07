// src/main.jsx
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Dashboard from './Dashboard.vue';

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      component: App,
      meta: { title: 'Home' } 
    },
    { 
      path: '/dashboard', 
      component: Dashboard,
      meta: { title: 'Dashboard' } 
    }
  ]
});

// Create and mount the app
const app = createApp({
  render: () => <App /> // JSX render function
});

app.use(router);

// Global navigation guard example
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'My Vue App';
  next();
});

app.mount('#app');