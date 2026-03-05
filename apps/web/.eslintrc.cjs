/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    // Stage 2 keeps linting conservative: we want structure + tooling without breaking existing code.
    // Stricter rules can be introduced incrementally in later stages.
  },
};
