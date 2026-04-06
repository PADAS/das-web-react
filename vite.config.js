import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

function osanoPlugin() {
  return {
    name: 'inject-osano',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (ctx.server) return html;
        const osanoSnippet = `
    <!-- Osano Cookies Consent Notice start for pamdas.org -->
    <script src="https://cmp.osano.com/AzqB4OUPPVD5j8EeT/bc796e8a-d3d4-4a74-b9c7-f737cbc3379b/osano.js"></script>
    <style>.osano-cm-widget{display: none;}</style>
    <!-- Osano Cookies Consent Notice end for pamdas.org -->`;
        return html.replace('</body>', `${osanoSnippet}\n</body>`);
      },
    },
  };
}

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
    osanoPlugin(),
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
