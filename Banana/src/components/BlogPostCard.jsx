import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/BlogPostCard.css';

export default function BlogPostCard({ title, excerpt, date, author, tags }) {
  return (
    <article className="blog-post-card">
      <div className="post-content">
        <h2 className="post-title">
          <Link to={`/blog/${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </Link>
        </h2>
        <div className="post-meta">
          <span className="post-date">{date}</span>
          <span className="post-author">By {author}</span>
        </div>
        <p className="post-excerpt">{excerpt}</p>
      </div>
      {tags && tags.length > 0 && (
        <div className="post-tags">
          {tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}