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
      // Third-party runtime assets copied in by scripts/copy-pdfjs-assets.mjs.
      'public/pdfjs/**',
      // Scratch scripts written into the root by an exploratory audit. They are
      // never project source, and a crashed run leaves them behind — without
      // this, that debris fails `pnpm verify` and looks like a real defect.
      '.*.mjs',
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
    // The JSON-LD serialiser, the pre-paint theme script, the embed theme
    // script and the CMS prose renderer are the only audited exceptions. None
    // of them ever receives visitor input: the first three are built from our
    // own constants, and the fourth renders HTML authored in our own CMS.
    files: [
      'components/seo/json-ld.tsx',
      'app/layout.tsx',
      'app/embed/[slug]/layout.tsx',
      'components/blog/prose.tsx',
    ],
    rules: { 'react/no-danger': 'off' },
  },
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Standalone Node scripts, run by hand rather than bundled. Printing what
    // they produced is the point.
    files: ['tests/fixtures/**/*.mjs', 'scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
];

export default config;
