<template>
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-4">Examples</h1>
      <div class="prose">
        <h2>Counter App</h2>
        <pre><code class="language-javascript">const count = ref(0);</code></pre>
  
        <h2>Todo List</h2>
        <pre><code class="language-javascript">const todos = ref([]);</code></pre>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Examples',
  };
  </script>