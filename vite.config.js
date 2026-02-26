import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

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
  ],

  server: {
    port: Number(process.env.PORT) || 9000,
  },
});
