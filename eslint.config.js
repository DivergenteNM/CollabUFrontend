const tsParser = require('@typescript-eslint/parser');
const angularEslintPlugin = require('@angular-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      '.angular/**',
      'coverage/**',
    ],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    plugins: {
      '@angular-eslint': angularEslintPlugin,
    },
    rules: {
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        {
          template: 10,
          styles: 10,
        },
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    rules: {},
  },
];
