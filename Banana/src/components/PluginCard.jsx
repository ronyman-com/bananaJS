import React from 'react';
import '../styles/components/PluginCard.css';

export default function PluginCard({ name, description, author, stars, official }) {
  return (
    <div className={`plugin-card ${official ? 'official' : ''}`}>
      <h3>
        {name}
        {official && <span className="official-badge">Official</span>}
      </h3>
      <p>{description}</p>
      <div className="meta">
        <span>By {author}</span>
        <span className="stars">
          ⭐ {stars}
        </span>
      </div>
    </div>
  );
}