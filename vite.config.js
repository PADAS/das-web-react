import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// Treat .js files in src as JSX so entry and imports work without renaming to .jsx
function jsxJsPlugin() {
  return {
    name: 'vite:jsx-js',
    enforce: 'pre',
    async transform(code, id) {
      if (id.includes('/src/') && id.endsWith('.js') && !id.includes('node_modules')) {
        const { transformWithEsbuild } = await import('vite');
        const result = await transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
        return { code: result.code, map: result.map };
      }
    },
  };
}

export default defineConfig({
  plugins: [
    jsxJsPlugin(),
    react({ include: /\.(js|jsx|ts|tsx)$/ }),
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
  build: {
    outDir: 'build',
  },
  css: {
    modules: {
      localsConvention: 'dashes',
    },
  },
  envPrefix: 'REACT_APP_',
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
});
