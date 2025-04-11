import React from 'react';
import BlogPostCard from '../components/BlogPostCard';
import '../styles/pages/Blog.css';

const blogPosts = [
  {
    id: 1,
    title: 'Introducing BananaJS 1.0',
    excerpt: 'Announcing the official release of BananaJS framework',
    date: 'May 15, 2023',
    author: 'Rony MAN',
    tags: ['release', 'announcement']
  },
  {
    id: 2,
    title: 'State Management in BananaJS',
    excerpt: 'Learn how to manage application state effectively',
    date: 'June 2, 2023',
    author: 'Jane Developer',
    tags: ['tutorial', 'state']
  },
  {
    id: 3,
    title: 'Building Plugins for BananaJS',
    excerpt: 'Extend BananaJS with custom plugins',
    date: 'June 18, 2023',
    author: 'Rony MAN',
    tags: ['plugins', 'advanced']
  }
];

export default function Blog() {
  return (
    <div className="blog-page">
      <h1>BananaJS Blog</h1>
      <p className="subtitle">News, tutorials and updates about BananaJS</p>
      
      <div className="blog-posts">
        {blogPosts.map(post => (
          <BlogPostCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt}
            date={post.date}
            author={post.author}
            tags={post.tags}
          />
        ))}
      </div>
    </div>
  );
}