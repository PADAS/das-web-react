'use strict';

// Custom Babel plugin to transform `import.meta.env.*` into `process.env.*`.
module.exports = ({ types }) => ({
  name: 'transform-import-meta-env',

  visitor: {
    MemberExpression: (path) => {
      if (
        types.isMemberExpression(path.node.object) &&
        types.isMetaProperty(path.node.object.object) &&
        path.node.object.object.meta.name === 'import' &&
        path.node.object.object.property.name === 'meta' &&
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
  },
});
