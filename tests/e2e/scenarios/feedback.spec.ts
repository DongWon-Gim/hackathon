/**
 * E2E 테스트: 피드백 입력 시나리오
 * 관련 기능: FEAT-002, FEAT-002-1
 * 관련 화면: SCR-003, SCR-003-1
 *
 * 피드백 페이지는 세션 ID와 로그인 상태가 필요하므로,
 * 서버 + 시드 데이터 없이 실행 가능한 테스트는 구조 검사에 한정된다.
 */
import { test, expect } from '@playwright/test'

test.describe('피드백 입력 시나리오', () => {
  // ---------------------------------------------------------------------------
  // 인증 없이 접근 시 리다이렉트 확인
  // ---------------------------------------------------------------------------

  test('비로그인 상태에서 세션 페이지 접근 시 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/session/some-session-id')
    await expect(page).toHaveURL(/\/login/)
  })

  test('비로그인 상태에서 새 세션 생성 페이지 접근 시 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/new')
    await expect(page).toHaveURL(/\/login/)
  })

  // ---------------------------------------------------------------------------
  // 서버 + 시드 데이터가 필요한 복합 시나리오 (skip)
  // ---------------------------------------------------------------------------

  test.skip('[TC-047] AI 문체 변환 OFF로 피드백을 작성하고 제출하면 성공 메시지가 표시된다', async ({ page }) => {
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 MEMBER 세션 쿠키 (또는 loginAsMember 헬퍼)
     * - ACTIVE 상태의 세션 ID (TEST_SESSION_ID 환경변수)
     */
    const sessionId = process.env.TEST_SESSION_ID || 'test-session-id'

    // 로그인 상태 설정 — 실제 테스트에서는 storageState 또는 API 로그인 사용
    // await loginAsMember(page)

    await page.goto(`/session/${sessionId}`)

    // Problem 탭 선택
    await page.click('[data-testid="category-tab-problem"]')

    // 피드백 입력
    await page.fill('[data-testid="feedback-textarea"]', '배포 프로세스가 너무 오래 걸립니다.')

    // AI 변환이 OFF인지 확인
    const aiToggle = page.locator('[data-testid="ai-transform-toggle"]')
    await expect(aiToggle).not.toBeChecked()

    // 제출
    await page.click('[data-testid="submit-button"]')

    // 성공 메시지 확인
    await expect(page.locator('[data-testid="toast-message"]')).toContainText('피드백이 제출되었습니다')
  })

  test.skip('[TC-048] AI 문체 변환 ON 상태에서 피드백 제출 시 변환 미리보기 모달이 표시된다', async ({ page }) => {
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 MEMBER 세션 쿠키
     * - ACTIVE 상태의 세션 ID
     * - ANTHROPIC_API_KEY 설정 (AI 변환 호출)
     */
    const sessionId = process.env.TEST_SESSION_ID || 'test-session-id'

    // await loginAsMember(page)
    await page.goto(`/session/${sessionId}`)

    // Problem 탭 선택 후 피드백 입력
    await page.click('[data-testid="category-tab-problem"]')
    await page.fill('[data-testid="feedback-textarea"]', '배포할 때마다 30분씩 걸리는 거 진짜 미치겠음... ㅠㅠ')

    // AI 변환 토글 ON
    await page.click('[data-testid="ai-transform-toggle"]')

    // 제출 버튼 클릭
    await page.click('[data-testid="submit-button"]')

    // AI 문체 변환 모달이 표시되어야 함
    await expect(page.locator('[data-testid="style-transform-modal"]')).toBeVisible()

    // 원본 텍스트 표시 확인
    await expect(page.locator('[data-testid="original-text"]')).toContainText('30분씩 걸리는 거')

    // 변환 결과 표시 확인
    await expect(page.locator('[data-testid="transformed-text"]')).toBeVisible({ timeout: 15000 })
  })

  test.skip('마감된 세션에서 피드백 입력 필드가 비활성화된다', async ({ page }) => {
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 사용자 세션
     * - CLOSED 상태의 세션 ID (CLOSED_SESSION_ID 환경변수)
     */
    const closedSessionId = process.env.CLOSED_SESSION_ID || 'closed-session-id'

    // await loginAsMember(page)
    await page.goto(`/session/${closedSessionId}`)

    await expect(page.locator('[data-testid="feedback-textarea"]')).toBeDisabled()
    await expect(page.locator('[data-testid="session-closed-message"]')).toBeVisible()
  })

  test.skip('재변환 버튼 클릭 시 AI 변환 결과가 새로 갱신된다', async ({ page }) => {
    /**
     * 필요 환경:
     * - npm run dev 실행 중
     * - 로그인된 MEMBER 세션
     * - ACTIVE 세션 ID
     * - ANTHROPIC_API_KEY 설정
     *
     * AI 변환 모달이 열린 상태에서 재변환 버튼을 클릭하면
     * 로딩 후 새 변환 결과가 표시되어야 한다.
     */
  })
})
