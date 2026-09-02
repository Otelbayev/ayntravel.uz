import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * ESLint 9 flat config.
 *
 * `eslint-config-next` 16 flat massiv sifatida eksport qiladi, shuning uchun
 * `FlatCompat` kerak emas — to'g'ridan-to'g'ri yoyiladi.
 */
export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // Refaktoringdan keyin qolib ketgan importlarni topadi
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
