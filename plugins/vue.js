// plugins/vue.js
const { createFilter } = require('@rollup/pluginutils');
const { compileTemplate, parse } = require('@vue/compiler-sfc');

module.exports = function vuePlugin() {
  const filter = createFilter(/\.vue$/);

  return {
    name: 'banana-vue-plugin',
    transform(code, id) {
      if (filter(id)) {
        const { descriptor } = parse(code);
        const template = compileTemplate({
          source: descriptor.template.content,
          filename: id,
          id,
        });

        return `
          ${template.code}
          export default { render: ${template.code} }
        `;
      }
    },
  };
};