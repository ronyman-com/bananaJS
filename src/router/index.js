import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import Dashboard from '../Dashboard';
import { useEffect } from 'react';

const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />
      }
    ]
  }
];

const router = createBrowserRouter(routes);

// WebSocket connection setup (can be moved to a custom hook)
export function useWebSocket() {
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      console.log('Message from server:', event.data);
      // Handle incoming messages
    };

    return () => {
      ws.close();
    };
  }, []);
}

// Router provider component
export function Router() {
  return <RouterProvider router={router} />;
}

// Log initial path
console.log('Initial path:', window.location.pathname);