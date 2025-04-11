import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import GettingStarted from '../pages/GettingStarted';
import Features from '../pages/Features';
import Plugins from '../pages/Plugins';
import ApiReference from '../pages/ApiReference';
import Examples from '../pages/Examples';
import Blog from '../pages/Blog';
import Changelog from '../pages/Changelog';
import News from '../pages/News';
import NotFound from '../pages/NotFound';

// Client-side router configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'getting-started',
        element: <GettingStarted />
      },
      {
        path: 'features',
        element: <Features />
      },
      {
        path: 'plugins',
        element: <Plugins />
      },
      {
        path: 'api',
        element: <ApiReference />
      },
      {
        path: 'examples',
        element: <Examples />
      },
      {
        path: 'blog',
        element: <Blog />
      },
      {
        path: 'changelog',
        element: <Changelog />
      },
      {
        path: 'news',
        element: <News />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

// Server-side route configuration (for SSR/SSG)
export const serverRoutes = [
  { path: '/', component: Home, exact: true },
  { path: '/getting-started', component: GettingStarted },
  { path: '/features', component: Features },
  { path: '/plugins', component: Plugins },
  { path: '/api', component: ApiReference },
  { path: '/examples', component: Examples },
  { path: '/blog', component: Blog },
  { path: '/changelog', component: Changelog },
  { path: '/news', component: News }
];

// Router provider component
export function Router() {
  return <RouterProvider router={router} />;
}

// Utility functions
export function getActivePath() {
  return window.location.pathname;
}

export function isActivePath(path) {
  return getActivePath() === path;
}

// For dynamic route generation (e.g., for docs)
export function createDocRoutes(docs) {
  return docs.map(doc => ({
    path: `/docs/${doc.slug}`,
    component: doc.component,
    exact: true
  }));
}