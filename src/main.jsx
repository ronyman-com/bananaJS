// src/main.jsx (React version)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/main.css';

const root = ReactDOM.createRoot(document.getElementById('root'));


// In your React/Vue component
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


root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


