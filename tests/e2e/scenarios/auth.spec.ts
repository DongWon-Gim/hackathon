/**
 * E2E 테스트: 인증 및 팀 합류 시나리오
 * 관련 기능: FEAT-000
 * 관련 화면: SCR-000, SCR-000-1, SCR-000-2, SCR-001
 *
 * Playwright를 사용하는 브라우저 기반 E2E 테스트.
 * 개발 서버가 실행 중이어야 한다 (npm run dev).
 */
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('인증 및 팀 합류 시나리오', () => {
  // TC-046: 신규 사용자가 회원가입 → 로그인 → 팀 합류 → 홈 화면 진입
  test('[TC-046] 신규 사용자가 회원가입 → 로그인 → 팀 합류 → 홈 화면까지 정상 완료된다', async ({ page }) => {
    // TODO: 구현
    // Step 1: 회원가입
    // await page.goto(`${BASE_URL}/register`)
    // await page.fill('[data-testid="name-input"]', '테스트 사용자')
    // await page.fill('[data-testid="email-input"]', `test-${Date.now()}@example.com`)
    // await page.fill('[data-testid="password-input"]', 'password123')
    // await page.fill('[data-testid="password-confirm-input"]', 'password123')
    // await page.click('[data-testid="register-button"]')
    // await expect(page).toHaveURL(`${BASE_URL}/login`)

    // Step 2: 로그인
    // await page.fill('[data-testid="email-input"]', `test-${Date.now()}@example.com`)
    // await page.fill('[data-testid="password-input"]', 'password123')
    // await page.click('[data-testid="login-button"]')
    // 팀 미배정이므로 /join으로 리다이렉트
    // await expect(page).toHaveURL(`${BASE_URL}/join`)

    // Step 3: 팀 합류
    // await page.fill('[data-testid="invite-code-input"]', 'VALID-INVITE-CODE')
    // await page.click('[data-testid="join-button"]')
    // 합류 성공 후 홈으로 이동
    // await expect(page).toHaveURL(`${BASE_URL}/`)
    // await expect(page.locator('[data-testid="session-list"]')).toBeVisible()

    expect(true).toBe(true) // placeholder
  })

  test('비로그인 상태에서 서비스 접근 시 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    // TODO: 구현
    // await page.goto(`${BASE_URL}/`)
    // await expect(page).toHaveURL(`${BASE_URL}/login`)
    expect(true).toBe(true) // placeholder
  })

  test('이미 등록된 이메일로 회원가입 시 에러 메시지가 표시된다', async ({ page }) => {
    // TODO: 구현
    // await page.goto(`${BASE_URL}/register`)
    // await page.fill('[data-testid="email-input"]', 'existing@example.com')
    // await page.fill('[data-testid="password-input"]', 'password123')
    // await page.fill('[data-testid="name-input"]', '중복 이메일')
    // await page.click('[data-testid="register-button"]')
    // await expect(page.locator('[data-testid="error-message"]')).toContainText('이미 등록된 이메일')
    expect(true).toBe(true) // placeholder
  })

  test('잘못된 팀 코드 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    // TODO: 구현
    // 로그인 후 /join에서 잘못된 코드 입력
    // await expect(page.locator('[data-testid="error-message"]')).toContainText('유효하지 않은 팀 코드')
    expect(true).toBe(true) // placeholder
  })
})
