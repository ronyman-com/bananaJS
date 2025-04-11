import React from 'react';
import PluginCard from '../components/PluginCard';
import '../styles/pages/Plugins.css';

const plugins = [
  {
    name: "Banana-Router",
    description: "Official router plugin with advanced features",
    author: "BananaJS Team",
    stars: 245,
    official: true
  },
  {
    name: "Banana-State",
    description: "Reactive state management solution",
    author: "BananaJS Team",
    stars: 189,
    official: true
  },
  {
    name: "Banana-UI",
    description: "Component library with Material Design",
    author: "Community",
    stars: 132,
    official: false
  },
  {
    name: "Banana-Auth",
    description: "Authentication utilities for Firebase and Auth0",
    author: "Community",
    stars: 87,
    official: false
  }
];

export default function Plugins() {
  return (
    <div className="plugins-page">
      <h1>BananaJS Plugins</h1>
      <p className="subtitle">
        Extend your BananaJS application with powerful plugins
      </p>
      
      <div className="plugins-list">
        {plugins.map((plugin, index) => (
          <PluginCard
            key={index}
            name={plugin.name}
            description={plugin.description}
            author={plugin.author}
            stars={plugin.stars}
            official={plugin.official}
          />
        ))}
      </div>
    </div>
  );
}