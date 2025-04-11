// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

const Home = () => {
  const { isConnected } = useWebSocket();

  const features = [
    {
      title: "Fast Refresh",
      description: "Instant feedback with hot module replacement",
      icon: "⚡"
    },
    {
      title: "Modern Stack",
      description: "Built with React, Vite, and Tailwind CSS",
      icon: "🛠️"
    },
    {
      title: "Real-time Stats",
      description: "WebSocket-powered development dashboard",
      icon: "📊"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Welcome to <span className="text-yellow-500">BananaJS</span>
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          A modern, fast, and lightweight JavaScript framework
        </p>
        
        {/* Connection Status Badge */}
        <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          {isConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              Connected to development server
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
              Connecting to development server...
            </>
          )}
        </div>
        
        <div className="mt-8 flex justify-center space-x-4">
          <Link 
            to="/getting-started" 
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 shadow-sm"
          >
            Get Started
          </Link>
          <Link 
            to="/dashboard" 
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Key Features</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="max-w-4xl mx-auto mt-16 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Start</h2>
        <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm">
            <code>
{`# Create a new project
npx banana create my-app

# Navigate to project
cd my-app

# Start development server
npm run dev`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Home;