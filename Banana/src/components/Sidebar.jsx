import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/components/Sidebar.css';

const sidebarItems = [
  { path: '/', name: 'Overview', icon: '🏠' },
  { path: '/getting-started', name: 'Getting Started', icon: '🚀' },
  { path: '/api-reference', name: 'API Reference', icon: '📚' },
  { path: '/examples', name: 'Examples', icon: '💡' },
  { path: '/plugins', name: 'Plugins', icon: '🔌' },
  { path: '/changelog', name: 'Changelog', icon: '🔄' },
  { path: '/news', name: 'News', icon: '📢' }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '➡️' : '⬅️'}
      </button>

      <nav className="sidebar-nav">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            exact
            className="sidebar-link"
            activeClassName="active"
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <a 
            href="https://github.com/ronyman-com/bananaJS" 
            target="_blank" 
            rel="noopener noreferrer"
            className="sidebar-external-link"
          >
            <img src="/github-icon.svg" alt="GitHub" />
            GitHub Repository
          </a>
        </div>
      )}
    </aside>
  );
}