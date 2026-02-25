'use strict';

// Babel plugin for Jest: replaces import.meta.env with process.env so that
// REACT_APP_* and other env vars work in tests.
module.exports = ({ types }) => ({
  name: 'transform-import-meta-env',
  visitor: {
    MemberExpression: (path) => {
      if (!types.isMemberExpression(path.node.object)) {
        return;
      }

      const inner = path.node.object;
      if (!types.isMetaProperty(inner.object)
        || !types.isIdentifier(inner.property)
        || inner.property.name !== 'env') {
        return;
      }

      const meta = inner.object;
      if (!types.isIdentifier(meta.meta)
        || meta.meta.name !== 'import'
        || !types.isIdentifier(meta.property)
        || meta.property.name !== 'meta') {
        return;
      }

      const prop = path.node.property;
      const computed = !types.isIdentifier(prop);
      path.replaceWith(
        types.memberExpression(
          types.memberExpression(
            types.identifier('process'),
            types.identifier('env')
          ),
          types.cloneNode(prop),
          computed,
        ),
      );
    },
  },
});
