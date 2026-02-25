'use strict';

/**
 * Babel plugin for Jest: replaces import.meta.env with process.env
 * so that REACT_APP_* and other env vars work in tests.
 */
module.exports = function transformImportMetaEnv({ types: t }) {
  return {
    name: 'transform-import-meta-env',
    visitor: {
      MemberExpression(path) {
        const node = path.node;
        // import.meta.env.X -> process.env.X
        if (!t.isMemberExpression(node.object)) return;
        const inner = node.object;
        if (!t.isMetaProperty(inner.object) || !t.isIdentifier(inner.property) || inner.property.name !== 'env') return;
        const meta = inner.object;
        if (!t.isIdentifier(meta.meta) || meta.meta.name !== 'import' || !t.isIdentifier(meta.property) || meta.property.name !== 'meta') return;
        const prop = node.property;
        const computed = !t.isIdentifier(prop);
        path.replaceWith(t.memberExpression(t.memberExpression(t.identifier('process'), t.identifier('env')), t.cloneNode(prop), computed));
      },
    },
  };
};
