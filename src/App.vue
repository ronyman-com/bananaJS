<template>
  <div id="app">
    <h1>BananaJS Works!</h1>
    <p>Welcome to your Vue application</p>
    
    <!-- Navigation to dashboard -->
    <router-link to="/dashboard" class="nav-link">
      Go to Dashboard
    </router-link>
    
    <!-- Router view for content -->
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    console.log('App component mounted');
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.nav-link {
  display: inline-block;
  margin: 20px;
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
</style>