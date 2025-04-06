// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard.vue'; // Or your React Dashboard component

const App = () => {
  return (
    <Router>
      <div className="app">
        <header>
          <h1>Welcome to BananaJS</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const Home = () => (
  <div className="home">
    <h2>Home Page</h2>
    <p>This is the main page of your BananaJS application</p>
  </div>
);

export default App;