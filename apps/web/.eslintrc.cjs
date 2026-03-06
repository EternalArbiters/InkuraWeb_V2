/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    // Keep Stage 10 linting conservative.
    // The repo is still mid-migration from the legacy codebase, so these rules
    // stay visible as warnings without blocking production builds.
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/no-unescaped-entities': 'warn',
    'prefer-const': 'warn',
  },
};
