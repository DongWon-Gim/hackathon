// @ts-check
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // 전역 ignore
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      '**/*.vue',           // vue-eslint-parser 미설치로 제외
      '**/*.md',
      'eslint.config.js',
    ],
  },
  // TypeScript 권장 규칙 (타입 체크 없이 — tsconfig 불필요)
  ...tseslint.configs.recommended,
  // 규칙 완화 (해커톤 환경)
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
)
