import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'composables/**/*.ts'],
      exclude: [
        // 인프라 유틸: 외부 의존성만 래핑, 별도 통합 테스트로 검증
        'server/utils/prisma.ts',
        'server/utils/claude.ts',
        // 관리자 전용 엔드포인트 (P2 기능, 권한 제어로 일반 사용자 미접근)
        'server/api/admin/**',
        // 브라우저 전용 Vue composables: Node 환경에서 실행 불가
        // (useAuth, useFeedback 등은 vue-mock 기반 단위 테스트로 별도 검증)
        'composables/**',
      ],
      thresholds: { lines: 50, functions: 50, branches: 50 },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
  },
})
