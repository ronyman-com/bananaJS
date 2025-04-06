<template>
  <div id="react-app"></div>
</template>

<script>
export default {
  mounted() {
    import('../App.jsx').then(module => {
      // Initialize React here
      // Requires react-dom and integration config
    });
  }
}
</script>