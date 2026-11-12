import { createRequire } from 'module';
import { defineConfig, loadEnv, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import svgr from 'vite-plugin-svgr';

const FAVICON_SVG_PATH = createRequire(import.meta.url)
  .resolve('@allenai/design-system/er-legacy/assets/EarthRanger-Logo-icon.svg');

// Filter app source .js files. Leave out Vite virtual modules and node_modules.
const JS_APP_SOURCE_MODULE_ID_REGEX =
  // Vite prefixes virtual module ids with a NUL character.
  // eslint-disable-next-line no-control-regex
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

// The DAS admin pages link /favicon.svg from the site root, which this app serves.
const faviconPlugin = () => ({
  name: 'serve-favicon-svg',
  configureServer: (server) => {
    server.middlewares.use('/favicon.svg', (_, response) => {
      response.setHeader('Content-Type', 'image/svg+xml');
      response.end(readFileSync(FAVICON_SVG_PATH));
    });
  },
  generateBundle() {
    this.emitFile({ fileName: 'favicon.svg', source: readFileSync(FAVICON_SVG_PATH), type: 'asset' });
  },
});

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

export default defineConfig(({ mode }) => ({
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
    faviconPlugin(),
  ],
  server: {
    port: Number(loadEnv(mode, process.cwd(), '').PORT) || 9000,
    watch: {
      // Claude Code keeps full worktrees of this repository there.
      ignored: ['**/.claude/**'],
    },
  },
}));
