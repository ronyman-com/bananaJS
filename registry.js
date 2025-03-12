// registry.js
const express = require('express');
const app = express();
const PORT = 5000;

const plugins = [
  { name: 'markdown-plugin', url: 'https://api.bananajs.com/plugins/markdown.js' },
  { name: 'csv-plugin', url: 'https://api.bananajs.com/plugins/csv.js' },
];

app.get('/plugins', (req, res) => {
  res.json(plugins);
});

app.listen(PORT, () => {
  console.log(`Plugin registry running at http://localhost:${PORT}`);
});