import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

const osanoPlugin = () => ({
  name: 'inject-osano',
  apply: 'build',
  transformIndexHtml: {
    order: 'pre',
    handler: () => [
      {
        tag: 'style',
        children: '.osano-cm-widget{display: none;}',
        injectTo: 'head',
      },
      {
        tag: 'script',
        attrs: {
          src: 'https://cmp.osano.com/AzqB4OUPPVD5j8EeT/bc796e8a-d3d4-4a74-b9c7-f737cbc3379b/osano.js',
        },
        injectTo: 'body',
      },
    ],
  },
});

export default defineConfig({
  build: {
    // Match CRA build output directory.
    outDir: 'build',
  },

  // Match CRA environment variable prefix.
  envPrefix: 'REACT_APP_',

  // Transform .js files as if they were .jsx files.
  esbuild: {
    loader: 'jsx',
    include: /.*\.jsx?$/,
    exclude: []
  },

  optimizeDeps: {
    // Transform dependencies .js files as if they were .jsx files.
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },

  plugins: [
    react(),

    // Match CRA SVG transformation.
    svgr({
      include: '**/*.svg',
      exclude: '**/*.svg?url',
      svgrOptions: {
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),

    osanoPlugin(),
  ],

  server: {
    port: Number(process.env.PORT) || 9000,
  },
});
