<template>
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-4">Welcome to Banana.js</h1>
      <p class="text-lg mb-8">
        A modern, fast, and lightweight JavaScript framework for building web applications.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4">Getting Started</h2>
          <p class="mb-4">Learn how to install and set up Banana.js.</p>
          <router-link to="/getting-started" class="text-blue-500 hover:underline">
            Get Started →
          </router-link>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4">Features</h2>
          <p class="mb-4">Explore the powerful features of Banana.js.</p>
          <router-link to="/features" class="text-blue-500 hover:underline">
            View Features →
          </router-link>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4">Plugins</h2>
          <p class="mb-4">Extend Banana.js with plugins.</p>
          <router-link to="/plugins" class="text-blue-500 hover:underline">
            Browse Plugins →
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Home',
  };
  </script>