// Main application script
document.addEventListener('DOMContentLoaded', () => {
    // Print the current year
    document.getElementById('current-year').textContent = new Date().getFullYear();
  
    // Fetch GitHub stars
    fetch('https://api.github.com/repos/ronyman-com/bananaJS')
      .then(response => response.json())
      .then(data => {
        document.getElementById('github-stars').textContent = data.stargazers_count;
      })
      .catch(error => {
        console.error('Error fetching GitHub stars:', error);
        document.getElementById('github-stars').textContent = 'Error loading stars';
      });
  
    // Theme toggle logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
  
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      body.classList.add(savedTheme);
      themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
  
    themeToggleBtn.addEventListener('click', () => {
      body.classList.toggle('dark');
      const isDarkMode = body.classList.contains('dark');
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      themeToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
      console.log('Theme toggled:', isDarkMode ? 'Dark' : 'Light');
    });
  });