import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: [
      'dist',
      'public/firebase-messaging.js', // Ignore minified Firebase script
      'public/firebase-app.js'        // Ignore minified Firebase script
    ]
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,      // Browser globals (window, document, etc.)
        ...globals.serviceworker, // Add service worker globals (importScripts, self, clients)
        process: 'readonly'      // Add process as a readonly global
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Specific config for service worker files
    files: ['public/firebase-messaging-sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker // Ensure service worker globals are recognized
      }
    },
    rules: {
      'no-undef': 'off' // Disable no-undef since firebase is loaded via importScripts
    }
  }
];