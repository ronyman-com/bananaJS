import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <span className="text-2xl font-bold">BananaJS</span>
        <div className="space-x-4">
          <a href="/" className="hover:underline">Home</a>
          <a href="/about" className="hover:underline">About</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;