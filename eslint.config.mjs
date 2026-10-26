import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import jest from 'eslint-plugin-jest';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  globalIgnores([
    '.claude/',
    '.yarn/',
    'build/',
    'coverage/',
    'jest-config/',
    'public/',
  ]),

  {
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
    ],
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      globals: globals.browser,
    },
    name: 'javascript',
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        // `version: "detect"` still uses APIs removed in ESLint 10.
        version: '19.3.0',
      },
    },
  },

  {
    files: ['*.{js,mjs}', 'src/sw-build.js'],
    languageOptions: {
      globals: globals.node,
    },
    name: 'node',
  },

  {
    files: ['src/sw-custom.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        workbox: 'readonly',
      },
    },
    name: 'service-worker',
  },

  {
    extends: [jest.configs['flat/recommended']],
    files: ['**/*.test.{js,jsx}', 'src/setupTests.js', 'src/__test-helpers/**'],
    languageOptions: {
      globals: globals.node,
    },
    name: 'jest',
  },
]);
