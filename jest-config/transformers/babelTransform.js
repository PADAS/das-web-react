'use strict';

const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  plugins: [require.resolve('./transformImportMetaEnv.js')],
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: { node: 'current' },
      },
    ],
    [
      require.resolve('@babel/preset-react'),
      {
        runtime: 'automatic',
      },
    ],
  ],
});
