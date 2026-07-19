const expoConfig = require('eslint-config-expo/flat');
const reactHooks = require('eslint-plugin-react-hooks');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expoConfig,
  {
    ignores: ['.expo/**', 'dist/**'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/display-name': 'off'
    },
    settings: {
      react: {
        version: '19.2.3'
      }
    }
  }
];
