// plugins/react.js
const esbuild = require('esbuild');

module.exports = function reactPlugin() {
  return {
    name: 'banana-react-plugin',
    transform(code, id) {
      if (id.endsWith('.jsx') || id.endsWith('.tsx')) {
        const result = esbuild.transformSync(code, {
          loader: 'tsx',
          jsx: 'automatic', // Enable React 17+ JSX transform
        });
        return result.code;
      }
    },
  };
};