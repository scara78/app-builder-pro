import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['node_modules/**', 'dist/**', '*.js', 'coverage/**', 'scripts/**', 'test/**'],
  },
  {
    // Main source files
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        MessageChannel: 'readonly',
        MessageEvent: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TextDecoderStream: 'readonly',
        EventTarget: 'readonly',
        self: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-useless-assignment': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-case-declarations': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'prefer-const': 'off',
    },
  },
  {
    // Test files - relaxed rules
    files: [
      'src/**/__tests__/**',
      'src/**/__mocks__/**',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'features/**',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': 'off',
    },
  },
];