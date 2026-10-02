'use strict';

// Custom Babel plugin to transform `import.meta.env.*` into `process.env.*`,
// `import.meta.url` into the CJS module's file URL, and to strip any other
// `import.meta.*` access down to an empty object so Jest's CJS transform
// doesn't choke on syntax Node can't parse outside a module.
const isImportMeta = (types, node) => types.isMetaProperty(node)
  && node.meta.name === 'import'
  && node.property.name === 'meta';

module.exports = ({ template, types }) => ({
  name: 'transform-import-meta-env',

  visitor: {
    MemberExpression: (path) => {
      if (isImportMeta(types, path.node.object) && types.isIdentifier(path.node.property, { name: 'url' })) {
        path.replaceWith(template.expression.ast`require('url').pathToFileURL(__filename).href`);
      } else if (
        types.isMemberExpression(path.node.object) &&
        isImportMeta(types, path.node.object.object) &&
        types.isIdentifier(path.node.object.property, { name: 'env' })
      ) {
        path.replaceWith(
          types.memberExpression(
            types.memberExpression(
              types.identifier('process'),
              types.identifier('env')
            ),
            types.cloneNode(path.node.property),
            path.node.computed,
          ),
        );
      }
    },
    MetaProperty: (path) => {
      if (isImportMeta(types, path.node)) {
        path.replaceWith(types.objectExpression([]));
      }
    },
  },
});
