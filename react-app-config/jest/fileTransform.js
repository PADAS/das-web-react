'use strict';

const path = require('path');

module.exports = {
  process(_src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return { code: `module.exports = ${assetFilename};` };
  },
};
