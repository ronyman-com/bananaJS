import React from 'react';
import '../styles/pages/Changelog.css';

const versions = [
  {
    version: '1.0.0',
    date: 'May 15, 2023',
    changes: [
      'Initial stable release',
      'Core framework implementation',
      'React and Vue compatibility layer'
    ]
  },
  {
    version: '0.9.0',
    date: 'April 28, 2023',
    changes: [
      'Beta release with plugin system',
      'Improved documentation',
      'Performance optimizations'
    ]
  }
];

export default function Changelog() {
  return (
    <div className="changelog-page">
      <h1>BananaJS Changelog</h1>
      
      <div className="versions-list">
        {versions.map((release, index) => (
          <div key={index} className="version-card">
            <div className="version-header">
              <h2>v{release.version}</h2>
              <span className="release-date">{release.date}</span>
            </div>
            <ul className="changes-list">
              {release.changes.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}