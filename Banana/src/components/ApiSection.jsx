import React from 'react';
import '../styles/components/ApiSection.css';

export default function ApiSection({ title, methods }) {
  return (
    <section className="api-section">
      <h2>{title}</h2>
      <div className="method-list">
        {methods.map((method, index) => (
          <div key={index} className="method-card">
            <h3 className="method-name">{method.name}</h3>
            <p className="method-description">{method.description}</p>
            
            {method.params && method.params.length > 0 && (
              <div className="method-params">
                <h4>Parameters</h4>
                {method.params.map((param, paramIndex) => (
                  <div key={paramIndex} className="param-item">
                    <span className="param-name">{param.name}</span>
                    <span className="param-type">{param.type}</span>
                    <span className="param-description">{param.description}</span>
                  </div>
                ))}
              </div>
            )}

            {method.returns && (
              <div className="method-returns">
                <strong>Returns:</strong> {method.returns}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}