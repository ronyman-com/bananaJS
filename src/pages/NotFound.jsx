// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
    <Helmet>
      <title>404 Not Found | BananaJS</title>
      <meta name="description" content="The page you're looking for doesn't exist" />
    </Helmet>
    
    <div className="text-center">
      <h1 className="text-9xl font-extrabold text-yellow-500 mb-4">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-xl text-gray-600 max-w-md mx-auto mb-8">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div className="space-y-4 sm:space-y-0 sm:space-x-4">
        <Link 
          to="/" 
          className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 shadow-sm inline-block"
        >
          Return Home
        </Link>
        <Link 
          to="/dashboard" 
          className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 inline-block"
        >
          Go to Dashboard
        </Link>
      </div>
      
      <div className="mt-12">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Popular Pages</h3>
        <div className="flex flex-wrap justify-center gap-3">
          <Link 
            to="/getting-started" 
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Getting Started
          </Link>
          <Link 
            to="/features" 
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Features
          </Link>
          <Link 
            to="/api-reference" 
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            API Reference
          </Link>
          <Link 
            to="/examples" 
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Examples
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default NotFound;