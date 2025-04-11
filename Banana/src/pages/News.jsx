import React from 'react';
import NewsCard from '../components/NewsCard';
import '../styles/pages/News.css';

const newsItems = [
  {
    id: 1,
    title: 'BananaJS 1.1 Released',
    date: 'June 15, 2023',
    summary: 'New update includes performance improvements and bug fixes',
    category: 'Release',
    image: '/images/news/release-1.1.jpg'
  },
  {
    id: 2,
    title: 'Community Meetup Announced',
    date: 'June 5, 2023',
    summary: 'Join us for our first virtual BananaJS community meetup',
    category: 'Event',
    image: '/images/news/meetup.jpg'
  },
  {
    id: 3,
    title: 'New Documentation Portal',
    date: 'May 28, 2023',
    summary: 'Completely redesigned documentation with interactive examples',
    category: 'Update',
    image: '/images/news/docs.jpg'
  }
];

export default function News() {
  return (
    <div className="news-page">
      <div className="news-header">
        <h1>BananaJS News</h1>
        <p className="subtitle">Stay updated with the latest announcements and events</p>
      </div>
      
      <div className="news-filters">
        <button className="filter-btn active">All</button>
        <button className="filter-btn">Releases</button>
        <button className="filter-btn">Events</button>
        <button className="filter-btn">Updates</button>
      </div>
      
      <div className="news-grid">
        {newsItems.map(news => (
          <NewsCard
            key={news.id}
            title={news.title}
            date={news.date}
            summary={news.summary}
            category={news.category}
            image={news.image}
          />
        ))}
      </div>
    </div>
  );
}