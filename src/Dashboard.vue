<template>
  <div class="dashboard">
    <h2>Dashboard</h2>
    <p>This is your dashboard page</p>
    <router-link to="/" class="nav-link">
      Back to Home
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'Dashboard'
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
</style>