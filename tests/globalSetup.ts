/**
 * Vitest 전역 설정 — 통합 테스트 실행 전 test.db 스키마를 초기화한다.
 * vitest.config.ts 의 globalSetup 에서 참조된다.
 */
import { execSync } from 'child_process'

export default function () {
  try {
    execSync('npx prisma db push --force-reset --skip-generate', {
      env: {
        ...process.env,
        DATABASE_URL: 'file:./test.db',
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('[globalSetup] prisma db push failed:', e)
    throw e
  }
}
