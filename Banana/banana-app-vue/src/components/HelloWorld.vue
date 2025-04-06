<template>
    <div :class="styles.container">
      <p>This is a Vue component in Banana.js!</p>
    </div>
  </template>
  
  <script>
  import styles from '../styles/App.module.css';
  
  export default {
    data() {
      return { styles };
    },
  };
  </script>