import React from 'react';
import FeatureCard from '../components/FeatureCard';
import '../styles/pages/Features.css';

const features = [
  {
    title: "Universal Components",
    description: "Write components that work across React and Vue",
    icon: "🧩"
  },
  {
    title: "Built-in Routing",
    description: "Automatic client-side routing with lazy loading",
    icon: "🗺️"
  },
  {
    title: "State Management",
    description: "Simple reactive state system inspired by Pinia",
    icon: "📊"
  },
  {
    title: "Plugin System",
    description: "Extend functionality with official and community plugins",
    icon: "🔌"
  },
  {
    title: "SSR Ready",
    description: "Server-side rendering support out of the box",
    icon: "🖥️"
  },
  {
    title: "Dev Tools",
    description: "Integrated debugging and performance monitoring",
    icon: "�"
  }
];

export default function Features() {
  return (
    <div className="features-page">
      <h1>BananaJS Features</h1>
      <div className="features-grid">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </div>
  );
}