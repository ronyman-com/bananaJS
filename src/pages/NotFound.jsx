// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="not-found">
    <h2>404 - Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/" className="home-link">Return to Home</Link>
  </div>
);

export default NotFound;