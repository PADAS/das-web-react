const path = require('path');
const workboxBuild = require('workbox-build');

const buildSW = () => {
  // The build is expected to fail if the
  // sw install rules couldn't be generated.
  // Add a catch block to handle this scenario.
  return workboxBuild
    .injectManifest({
      swSrc: path.join(process.cwd(), 'src/sw-custom.js'), // custom sw rule
      swDest: path.join(process.cwd(), 'build/sw.js'), // sw output file (auto-generated)
      globDirectory: path.join(process.cwd(), 'build'),
      globPatterns: ['**/*.{js,html,css,png,svg}'],
      globIgnores: [
        '**/*service-worker*.js',
        '**/*precache-manifest*.js',
        // Heavy, dynamically-imported chunks: exclude from eager precache so a first
        // visit (e.g. the public community form) doesn't download the whole app.
        // They are still runtime-cached on demand by the JS/CSS route in sw-custom.js.
        '**/all-*.js', // epsg-index/all.json (~7.4 MB), only for custom-CRS coordinate features
        '**/PickMapLocationButton-*.js', // mapbox-gl (~1.76 MB), only when opening the map-location picker
      ],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
    })
    .then(({ count, size, warnings }) => {
      warnings.forEach(console.warn);
      console.info(`${count} files will be precached,
                  totaling ${size / (1024 * 1024)} MBs.`);
    })
    .catch((error) => {
      console.error('could not build service worker', error);
    });
};

buildSW();