import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/Footer.css';

const footerLinks = [
  { path: '/getting-started', text: 'Documentation' },
  { path: '/examples', text: 'Examples' },
  { path: '/blog', text: 'Blog' },
  { path: '/changelog', text: 'Changelog' },
  { path: '/news', text: 'News' }
];

const socialLinks = [
  { url: 'https://github.com/ronyman-com/bananaJS', icon: '/github-icon.svg', alt: 'GitHub' },
  { url: 'https://twitter.com', icon: '/twitter-icon.svg', alt: 'Twitter' },
  { url: 'https://discord.com', icon: '/discord-icon.svg', alt: 'Discord' }
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-heading">BananaJS</h3>
          <p className="footer-description">
            A modern, fast, and lightweight JavaScript framework for building web applications.
          </p>
        </div>

        <div className="footer-section">
          <h3 className="footer-heading">Resources</h3>
          <ul className="footer-links">
            {footerLinks.map((link, index) => (
              <li key={index}>
                <Link to={link.path} className="footer-link">
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-heading">Community</h3>
          <div className="social-links">
            {socialLinks.map((social, index) => (
              <a 
                key={index}
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                <img src={social.icon} alt={social.alt} className="social-icon" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">
          &copy; {new Date().getFullYear()} BananaJS by Rony MAN. MIT License.
        </p>
      </div>
    </footer>
  );
}