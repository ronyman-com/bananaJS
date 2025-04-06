import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../Dashboard.vue';
import ReactAppWrapper from '../ReactAppWrapper.vue';

const routes = [
  { path: '/', component: ReactAppWrapper },
  { path: '/dashboard', component: Dashboard },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;