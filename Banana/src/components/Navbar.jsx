import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/components/Navbar.css';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="logo-link">
            <img src="/logo.svg" alt="BananaJS Logo" className="logo" />
            <span className="brand-name">BananaJS</span>
          </Link>
          <button 
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
          >
            <span className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" exact className="nav-link" activeClassName="active">
            Home
          </NavLink>
          <NavLink to="/features" className="nav-link" activeClassName="active">
            Features
          </NavLink>
          <NavLink to="/getting-started" className="nav-link" activeClassName="active">
            Docs
          </NavLink>
          <NavLink to="/examples" className="nav-link" activeClassName="active">
            Examples
          </NavLink>
          <NavLink to="/blog" className="nav-link" activeClassName="active">
            Blog
          </NavLink>
          <div className="nav-actions">
            <a 
              href="https://github.com/ronyman-com/bananaJS" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-button"
            >
              <img src="/github-icon.svg" alt="GitHub" className="github-icon" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}