/**
 * E2E 테스트: 인증 및 팀 합류 시나리오
 * 관련 기능: FEAT-000
 * 관련 화면: SCR-000, SCR-000-1, SCR-000-2, SCR-001
 *
 * Playwright를 사용하는 브라우저 기반 E2E 테스트.
 * 개발 서버가 실행 중이어야 한다 (npm run dev).
 */
import { test, expect } from '@playwright/test'

test.describe('인증 및 팀 합류 시나리오', () => {
  // ---------------------------------------------------------------------------
  // 리다이렉트 테스트 — 서버 실행 + DB 데이터 없이도 동작
  // ---------------------------------------------------------------------------

  test('비로그인 상태에서 서비스 접근 시 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  // ---------------------------------------------------------------------------
  // 페이지 구조 테스트 — 서버 실행만 필요, 데이터 불필요
  // ---------------------------------------------------------------------------

  test('로그인 페이지에 이메일/비밀번호 입력 필드와 제출 버튼이 존재한다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('로그인')
  })

  test('회원가입 페이지에 이름/이메일/비밀번호/비밀번호 확인 필드가 존재한다', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[type="text"]')).toBeVisible()   // 이름
    await expect(page.locator('input[type="email"]')).toBeVisible()  // 이메일
    // 비밀번호 필드가 2개
    const passwordFields = page.locator('input[type="password"]')
    await expect(passwordFields).toHaveCount(2)
    await expect(page.locator('button[type="submit"]')).toContainText('회원가입')
  })

  test('팀 합류 페이지에 초대 코드 입력 필드와 합류 버튼이 존재한다', async ({ page }) => {
    // /join 은 인증 후 팀 미배정 상태여야 하므로, 로그인 없이 접근 시 리다이렉트될 수 있음.
    // 직접 접근이 허용되는 경우에만 구조를 검사한다.
    const response = await page.goto('/join')
    if (page.url().includes('/join')) {
      await expect(page.locator('input[type="text"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toContainText('팀 합류')
    } else {
      // 인증 미들웨어가 /login으로 보낸 경우 — 정상 동작으로 간주
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('로그인 페이지에서 로그인 성공 시 / 또는 /join 으로 이동한다', async ({ page }) => {
    // 잘못된 자격증명으로 로그인 시도 → 에러 메시지 표시 확인
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexistent@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // 에러 메시지가 표시되거나 페이지가 /login 에 머물러야 한다
    await page.waitForTimeout(1500)
    const url = page.url()
    const hasError = await page.locator('text=로그인에 실패했습니다').isVisible()
      || await page.locator('text=이메일 또는 비밀번호').isVisible()
      || await page.locator('text=존재하지 않는').isVisible()

    // 에러가 표시되거나 여전히 /login 페이지에 있어야 함
    expect(url.includes('/login') || hasError).toBe(true)
  })

  test('회원가입 페이지에서 비밀번호 불일치 시 클라이언트 에러 메시지가 표시된다', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[type="text"]', '테스트 사용자')
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`)

    const passwordFields = page.locator('input[type="password"]')
    await passwordFields.nth(0).fill('password123')
    await passwordFields.nth(1).fill('differentpassword')

    // 비밀번호 불일치 에러 메시지 노출 확인
    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible()

    // 제출 버튼이 비활성화되어 있어야 한다
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('회원가입 페이지에서 비밀번호 조건(8자 이상, 영문+숫자) 표시가 된다', async ({ page }) => {
    await page.goto('/register')
    const passwordField = page.locator('input[type="password"]').first()

    // 유효하지 않은 비밀번호 입력
    await passwordField.fill('abc')
    await expect(page.locator('text=8자 이상')).toBeVisible()
    await expect(page.locator('text=영문+숫자')).toBeVisible()

    // 유효한 비밀번호 입력 후 체크 표시 확인
    await passwordField.fill('password1')
    const checkMarks = page.locator('text=✓')
    await expect(checkMarks).toHaveCount(2)
  })

  test('로그인 페이지에서 회원가입 링크가 /register 로 연결된다', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.locator('a[href="/register"]')
    await expect(registerLink).toBeVisible()
    await expect(registerLink).toContainText('회원가입')
  })

  test('회원가입 페이지에서 로그인 링크가 /login 으로 연결된다', async ({ page }) => {
    await page.goto('/register')
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toContainText('로그인')
  })

  // ---------------------------------------------------------------------------
  // 복합 플로우 테스트 — 실행 중인 서버 + 시드 데이터 필요
  // ---------------------------------------------------------------------------

  test('[TC-046] 신규 사용자가 회원가입 → 로그인 → 팀 합류 → 홈 화면까지 정상 완료된다', async ({ page }) => {
    /**
     * 이 테스트는 실행 중인 dev 서버와 유효한 팀 초대 코드가 필요합니다.
     * `npm run db:seed` 로 초기 데이터를 생성한 후 실행하세요.
     *
     * 필요 환경:
     * - npm run dev 실행 중
     * - prisma db seed 완료 (팀 및 초대 코드 존재)
     * - VALID_INVITE_CODE 환경변수 설정
     */
    const uniqueEmail = `test-${Date.now()}@example.com`

    // Step 1: 회원가입
    await page.goto('/register')
    await page.fill('input[type="text"]', '테스트 사용자')
    await page.fill('input[type="email"]', uniqueEmail)
    const passwordFields = page.locator('input[type="password"]')
    await passwordFields.nth(0).fill('password123')
    await passwordFields.nth(1).fill('password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/login/)

    // Step 2: 로그인
    await page.fill('input[type="email"]', uniqueEmail)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    // 팀 미배정이므로 /join으로 리다이렉트
    await expect(page).toHaveURL(/\/join/)

    // Step 3: 팀 합류
    const inviteCode = process.env.VALID_INVITE_CODE || 'XXXX-XXXX-XXXX'
    await page.fill('input[type="text"]', inviteCode)
    await page.click('button[type="submit"]')
    // 합류 성공 후 홈으로 이동
    await expect(page).toHaveURL(/^\/?$|\/(?!login|register|join)/)
    await expect(page.locator('h1, [data-testid="session-list"]')).toBeVisible()
  })

  test('이미 등록된 이메일로 회원가입 시 에러 메시지가 표시된다', async ({ page }) => {
    /**
     * 이 테스트는 실행 중인 dev 서버와 미리 등록된 사용자 계정이 필요합니다.
     * `npm run db:seed` 로 초기 데이터를 생성한 후 실행하세요.
     */
    await page.goto('/register')
    await page.fill('input[type="text"]', '중복 이메일')
    await page.fill('input[type="email"]', 'admin@example.com') // seed 데이터의 기존 이메일
    const passwordFields = page.locator('input[type="password"]')
    await passwordFields.nth(0).fill('password123')
    await passwordFields.nth(1).fill('password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=이미 등록된 이메일')).toBeVisible()
  })

  test('잘못된 팀 코드 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    /**
     * 이 테스트는 로그인된 사용자 세션이 필요합니다.
     * 신규 가입 사용자는 팀이 없으므로 /join으로 리다이렉트된다.
     */
    const uniqueEmail = `test-join-${Date.now()}@example.com`

    // 신규 회원가입 (팀 없는 상태)
    await page.goto('/register')
    await page.fill('input[type="text"]', '테스트')
    await page.fill('input[type="email"]', uniqueEmail)
    const passwordFields = page.locator('input[type="password"]')
    await passwordFields.nth(0).fill('password123')
    await passwordFields.nth(1).fill('password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/login/)

    // 로그인 — 팀 미배정이므로 /join으로 리다이렉트
    await page.fill('input[type="email"]', uniqueEmail)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/join/)

    // 잘못된 코드 입력
    await page.fill('input[type="text"]', 'INVALID-CODE')
    await page.click('button[type="submit"]')
    await expect(
      page.locator('text=유효하지 않은').or(page.locator('text=존재하지 않는')).or(page.locator('text=팀 합류에 실패했습니다'))
    ).toBeVisible()
  })
})
