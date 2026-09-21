import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import next from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import typescriptEslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
  },
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
  next.configs['core-web-vitals'],
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      '@next/next/no-img-element': 'off',
      '@next/next/no-page-custom-font': 'off',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    '.yarn/**',
    'docs/**',
    'out/**',
    'public/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
