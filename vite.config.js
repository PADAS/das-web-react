import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// Filter app source .js files. Leave out Vite virtual modules and node_modules.
const JS_APP_SOURCE_MODULE_ID_REGEX =
// eslint-disable-next-line no-control-regex -- Rollup virtual module ids start with a leading NUL.
  /^(?!\u0000)(?!.*[\\/]node_modules[\\/]).*\.js(?:\?|$)/;

const OSANO_SCRIPT_SRC = 'https://cmp.osano.com/AzqB4OUPPVD5j8EeT/bc796e8a-d3d4-4a74-b9c7-f737cbc3379b/osano.js';

const treatJsSourceAsJsx = () => {
  let resolvedConfig;

  return {
    name: 'treat-js-source-as-jsx',
    enforce: 'pre',
    configResolved: (config) => {
      resolvedConfig = config;
    },
    transform: {
      filter: {
        id: JS_APP_SOURCE_MODULE_ID_REGEX,
      },
      handler: async (code, id) => {
        const filepath = id.split('?')[0];
        const result = await transformWithOxc(code, filepath, {
          jsx: {
            development: !resolvedConfig.isProduction,
            importSource: 'react',
            runtime: 'automatic',
          },
          lang: 'jsx',
          sourceType: 'module',
        });

        return { code: result.code, map: result.map };
      },
    },
  };
};

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
          src: OSANO_SCRIPT_SRC,
        },
        injectTo: 'body',
      },
    ],
  },
});

export default defineConfig({
  build: {
    outDir: 'build',
  },
  envPrefix: 'REACT_APP_',
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
      },
    },
  },
  plugins: [
    treatJsSourceAsJsx(),
    react(),
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
