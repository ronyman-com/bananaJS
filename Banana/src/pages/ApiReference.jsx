import React from 'react';
import ApiSection from '../components/ApiSection';
import '../styles/pages/ApiReference.css';

const apiSections = [
  {
    title: 'Core API',
    methods: [
      {
        name: 'createApp',
        description: 'Initializes a new BananaJS application',
        params: [
          { name: 'options', type: 'object', description: 'Application configuration options' }
        ],
        returns: 'BananaJS application instance'
      },
      {
        name: 'useState',
        description: 'Create reactive state',
        params: [
          { name: 'initialValue', type: 'any', description: 'Initial state value' }
        ],
        returns: '[value, setValue] pair'
      }
    ]
  },
  {
    title: 'Router API',
    methods: [
      {
        name: 'createRouter',
        description: 'Creates a router instance',
        params: [
          { name: 'routes', type: 'array', description: 'Route configuration array' },
          { name: 'options', type: 'object', description: 'Optional router configuration' }
        ],
        returns: 'Router instance'
      }
    ]
  }
];

export default function ApiReference() {
  return (
    <div className="api-reference">
      <div className="api-header">
        <h1>BananaJS API Reference</h1>
        <p className="subtitle">Complete documentation of all available APIs</p>
      </div>
      
      <div className="search-box">
        <input type="text" placeholder="Search API..." />
        <button>Search</button>
      </div>
      
      <div className="api-content">
        {apiSections.map((section, index) => (
          <ApiSection
            key={index}
            title={section.title}
            methods={section.methods}
          />
        ))}
      </div>
    </div>
  );
}