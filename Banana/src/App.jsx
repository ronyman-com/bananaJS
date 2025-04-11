// Banana/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
//import { Navbar, Sidebar, Footer } from './components';
import './styles/main.css';

// Import all page components
import Home from './pages/Home';
import GettingStarted from './pages/GettingStarted';
import Features from './pages/Features';
import Plugins from './pages/Plugins';
import ApiReference from './pages/ApiReference';
import Examples from './pages/Examples';
import Blog from './pages/Blog';
import Changelog from './pages/Changelog';
import News from './pages/News';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/getting-started" element={<GettingStarted />} />
            <Route path="/features" element={<Features />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/api" element={<ApiReference />} />
            <Route path="/examples" element={<Examples />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/news" element={<News />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default App;