<template>
  <div class="container mx-auto p-6">
    <h1 class="text-4xl font-bold mb-6">Changelog</h1>
    <div v-for="(release, index) in changelog" :key="index" class="mb-8">
      <h2 class="text-2xl font-semibold mb-2">
        Version {{ release.version }} <span class="text-gray-500 text-sm">({{ release.date }})</span>
      </h2>
      <ul class="list-disc pl-6">
        <li v-for="(change, idx) in release.changes" :key="idx" class="mb-2">
          <span
            :class="`inline-block px-2 py-1 text-sm font-medium rounded-full ${getBadgeColor(change.type)}`"
          >
            {{ change.type }}
          </span>
          <span class="ml-2">{{ change.description }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      changelog: [],
    };
  },
  mounted() {
    // Fetch changelog data
    fetch('/changelog.json')
      .then((response) => response.json())
      .then((data) => (this.changelog = data))
      .catch((error) => console.error('Error fetching changelog:', error));
  },
  methods: {
    getBadgeColor(type) {
      switch (type) {
        case 'feature':
          return 'bg-green-100 text-green-800';
        case 'bugfix':
          return 'bg-red-100 text-red-800';
        case 'update':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    },
  },
};
</script>

<style scoped>
/* Add custom styles if needed */
</style>