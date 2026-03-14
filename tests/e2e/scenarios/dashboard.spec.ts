/**
 * E2E 테스트: 대시보드 및 AI 인사이트 시나리오
 * 관련 기능: FEAT-004, FEAT-005
 * 관련 화면: SCR-004
 *
 * 대시보드는 로그인 + 세션 데이터가 필요하므로,
 * 서버 + 시드 데이터 없이 실행 가능한 테스트는 리다이렉트 확인에 한정된다.
 */
import { test, expect } from '@playwright/test'
import { loginAsLeader, loginAsMember } from '../helpers/auth'

test.describe('대시보드 및 인사이트 시나리오', () => {
  // ---------------------------------------------------------------------------
  // 인증 없이 접근 시 리다이렉트 확인
  // ---------------------------------------------------------------------------

  test('비로그인 상태에서 대시보드 접근 시 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/session/some-session-id/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('비로그인 상태에서 홈(/) 접근 시 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('비로그인 상태에서 관리자 페이지 접근 시 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  // ---------------------------------------------------------------------------
  // 서버 + 시드 데이터가 필요한 복합 시나리오 (skip)
  // ---------------------------------------------------------------------------

  test('[TC-049] 팀장이 대시보드에서 인사이트 생성 버튼을 클릭하면 로딩 후 인사이트가 표시된다', async ({ page }) => {
    test.setTimeout(90000) // AI 호출이 30s+ 걸릴 수 있음
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 LEADER 세션 쿠키 (또는 loginAsLeader 헬퍼)
     * - CLOSED 상태의 세션 ID + 피드백 존재 (CLOSED_SESSION_ID 환경변수)
     * - ANTHROPIC_API_KEY 설정 (AI 인사이트 생성)
     */
    // 인사이트 생성은 CLOSED 세션에서만 가능
    const sessionId = process.env.CLOSED_SESSION_ID || 'closed-session-id'

    await loginAsLeader(page)

    // 이전 테스트 실행에서 생성된 인사이트 삭제 (테스트 격리 — API 직접 호출)
    await page.goto(`/session/${sessionId}/dashboard`)
    await page.evaluate(async (id) => {
      await fetch(`/api/sessions/${id}/insights`, { method: 'DELETE' }).catch(() => {})
    }, sessionId)
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 인사이트 생성 버튼 클릭 (팀장에게만 표시, CLOSED 세션)
    await expect(page.locator('[data-testid="generate-insight-button"]')).toBeVisible({ timeout: 5000 })
    await page.click('[data-testid="generate-insight-button"]')

    // 인사이트 결과 표시 확인 (30초 이내, fallback 모달 포함)
    // fallback 모달이 뜨면 '임시 데이터 사용' 버튼을 클릭하여 저장
    const insightSummary = page.locator('[data-testid="insight-summary"]')
    const fallbackBtn = page.locator('text=임시 데이터 사용')

    await expect(insightSummary.or(fallbackBtn)).toBeVisible({ timeout: 60000 })

    if (await fallbackBtn.isVisible()) {
      await fallbackBtn.click()
      await expect(insightSummary).toBeVisible({ timeout: 10000 })
    }

    await expect(page.locator('[data-testid="insight-issues"]')).toBeVisible()
  })

  test('피드백이 카테고리별(K/P/T)로 올바르게 표시된다', async ({ page }) => {
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 사용자 세션
     * - K/P/T 각 카테고리별 피드백이 있는 세션 ID
     */
    const sessionId = process.env.TEST_SESSION_ID || 'test-session-id'

    await loginAsMember(page)
    await page.goto(`/session/${sessionId}/dashboard`)

    await expect(page.locator('[data-testid="keep-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="problem-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="try-section"]')).toBeVisible()
  })

  test('팀원(MEMBER)에게는 인사이트 생성 버튼이 표시되지 않는다', async ({ page }) => {
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 MEMBER 세션 쿠키
     * - 세션 ID
     *
     * 권한 검사: MEMBER 역할에는 인사이트 생성 버튼이 노출되어선 안 된다.
     */
    const sessionId = process.env.TEST_SESSION_ID || 'test-session-id'

    await loginAsMember(page)
    await page.goto(`/session/${sessionId}/dashboard`)

    await expect(page.locator('[data-testid="generate-insight-button"]')).not.toBeVisible()
  })

  test('피드백이 없는 세션의 대시보드에서 빈 상태 안내가 표시된다', async ({ page }) => {
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 사용자 세션
     * - 피드백이 0개인 세션 ID (EMPTY_SESSION_ID 환경변수)
     */
    const emptySessionId = process.env.EMPTY_SESSION_ID || 'empty-session-id'

    await loginAsMember(page)
    await page.goto(`/session/${emptySessionId}/dashboard`)

    await expect(page.locator('[data-testid="empty-feedback-state"]')).toBeVisible()
  })
})
