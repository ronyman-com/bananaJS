// plugins/scss.js
const sass = require('sass');

module.exports = function scssPlugin() {
  return {
    name: 'banana-scss-plugin',
    transform(code, id) {
      if (id.endsWith('.scss')) {
        const result = sass.compileString(code);
        return {
          code: result.css,
          map: result.sourceMap,
        };
      }
    },
  };
};