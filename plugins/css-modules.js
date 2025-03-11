// plugins/css-modules.js
const postcss = require('postcss');
const postcssModules = require('postcss-modules');

module.exports = function cssModulesPlugin() {
  return {
    name: 'banana-css-modules-plugin',
    transform(code, id) {
      if (id.endsWith('.module.css')) {
        return postcss([postcssModules()])
          .process(code, { from: id })
          .then((result) => {
            return `
              export default ${JSON.stringify(result.css)};
            `;
          });
      }
    },
  };
};