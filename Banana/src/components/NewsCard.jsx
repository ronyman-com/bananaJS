import React from 'react';
import '../styles/components/NewsCard.css';

export default function NewsCard({ title, date, summary, category, image }) {
  return (
    <div className="news-card">
      <div className="news-image">
        <img src={image} alt={title} />
        <span className="category-badge">{category}</span>
      </div>
      <div className="news-content">
        <div className="news-date">{date}</div>
        <h3 className="news-title">{title}</h3>
        <p className="news-summary">{summary}</p>
        <button className="read-more">Read More</button>
      </div>
    </div>
  );
}