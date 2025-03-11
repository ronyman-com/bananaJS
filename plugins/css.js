// plugins/css.js
module.exports = function cssPlugin() {
  return {
    name: 'banana-css-plugin',
    transform(code, id) {
      if (id.endsWith('.css')) {
        return `
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(code)};
          document.head.appendChild(style);
        `;
      }
    },
  };
};
