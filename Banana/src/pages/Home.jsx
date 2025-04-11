import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/Home.css';

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to BananaJS</h1>
        <p>The sweetest JavaScript framework for modern web apps</p>
        <div className="cta-buttons">
          <Link to="/getting-started" className="btn primary">
            Get Started
          </Link>
          <Link to="/features" className="btn secondary">
            View Features
          </Link>
        </div>
      </section>

      <section className="highlights">
        <div className="highlight-card">
          <h3>Lightweight</h3>
          <p>Only 15kb gzipped with zero dependencies</p>
        </div>
        <div className="highlight-card">
          <h3>Blazing Fast</h3>
          <p>Built on Vite for instant hot module reloading</p>
        </div>
        <div className="highlight-card">
          <h3>Flexible</h3>
          <p>Works with React, Vue, or plain JavaScript</p>
        </div>
      </section>
    </div>
  );
}