import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import GettingStarted from '../pages/GettingStarted.vue';
import Features from '../pages/Features.vue';
import Plugins from '../pages/Plugins.vue';
import ApiReference from '../pages/ApiReference.vue';
import Examples from '../pages/Examples.vue';
import Blog from '../pages/Blog.vue';
import Changelog from '../pages/Changelog.vue'; // Import the Changelog component


const routes = [
  { path: '/', component: Home },
  { path: '/getting-started', component: GettingStarted },
  { path: '/features', component: Features },
  { path: '/plugins', component: Plugins },
  { path: '/api-reference', component: ApiReference },
  { path: '/examples', component: Examples },
  { path: '/blog', component: Blog },
  { path: '/changelog', component: Changelog }, // Add Changelog route
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;