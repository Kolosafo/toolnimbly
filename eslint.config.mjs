import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

/**
 * Flat config. eslint-config-next 16 ships native flat config arrays, so no
 * `FlatCompat` shim is needed.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Spec §7.9: user-entered text is never injected as HTML.
      'react/no-danger': 'error',
    },
  },
  {
    // The JSON-LD serialiser and the pre-paint theme script are the only
    // audited exceptions, and neither ever receives user input.
    files: ['components/seo/json-ld.tsx', 'app/layout.tsx'],
    rules: { 'react/no-danger': 'off' },
  },
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default config;
