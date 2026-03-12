import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import jest from 'eslint-plugin-jest';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  globalIgnores([
    '.github/',
    '.yarn/',
    'build/',
    'ci-helpers/',
    'jest-config/',
    'mock-api/',
    'nginx/',
    'node_modules/',
    'public/',
    'terraform/',
  ]),

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: 'module',
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'keyword-spacing': [
        'error',
        { before: true, after: true },
      ],
      'comma-spacing': [
        'error',
        { before: false, after: true },
      ],
      'arrow-spacing': [
        'error',
        { before: true, after: true },
      ],
      'key-spacing': [
        'error',
        { afterColon: true },
      ],
      'object-curly-spacing': ['error', 'always'],
      indent: [
        'error',
        2,
        { ignoredNodes: ['TemplateLiteral', 'JSXElement *'] },
      ],
      'template-curly-spacing': 'off',
      'react/jsx-indent': [
        'error',
        2,
      ],
      'linebreak-style': [
        'error',
        'unix',
      ],
      quotes: [
        'error',
        'single',
      ],
      semi: [
        'error',
        'always',
      ],
      'react/prop-types': 'off',
      strict: 'off',
      'max-len': 'off',
      'no-trailing-spaces': [
        'error',
        { ignoreComments: true },
      ],
      'no-prototype-builtins': 'off',
      'no-underscore-dangle': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: 'React|^_',
        },
      ],
      camelcase: 'off',
      'func-names': 'off',
      'react/no-this-in-sfc': 'off',
    },
  },

  {
    files: ['**/*.test.{js,jsx}', '**/setupTests.js', '**/src/__test-helpers/**/*.js'],
    ...jest.configs['flat/recommended'],
  },
]);
