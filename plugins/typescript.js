// plugins/typescript.js
const esbuild = require('esbuild');

module.exports = function typescriptPlugin() {
  return {
    name: 'banana-typescript-plugin',
    transform(code, id) {
      if (id.endsWith('.ts')) {
        const result = esbuild.transformSync(code, { loader: 'ts' });
        return result.code;
      }
    },
  };
};