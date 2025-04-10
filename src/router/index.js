import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../Dashboard.vue';

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;