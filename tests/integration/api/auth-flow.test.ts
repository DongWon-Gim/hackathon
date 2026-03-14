/**
 * 통합 테스트: 인증 플로우 (회원가입 → 로그인 → me 조회)
 * 관련 기능: FEAT-000
 * 관련 화면: SCR-000, SCR-000-1
 *
 * 실제 DB(테스트용 SQLite)를 사용한 통합 테스트.
 * 각 테스트 전 DB를 초기화하여 테스트 격리를 보장한다.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { testPrisma, clearDatabase, disconnectDatabase } from '../../helpers/db'

vi.mock('~/server/utils/prisma', () => ({ default: testPrisma }))

import registerHandler from '~/server/api/auth/register.post'
import loginHandler from '~/server/api/auth/login.post'
import meHandler from '~/server/api/auth/me.get'

/** h3 이벤트 mock 헬퍼 */
function makeEvent(body: Record<string, unknown>, context: Record<string, unknown> = {}) {
  return {
    _body: body,
    _params: {},
    context: { auth: context },
  }
}

describe('인증 플로우 통합 테스트', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  // TC-012: 회원가입 → 로그인 → me 조회 전체 플로우
  it('[TC-012] 회원가입 → 로그인 → me 조회 전체 플로우가 정상 동작한다', async () => {
    // Step 1: 회원가입
    const registerEvent = makeEvent({
      email: 'integration@test.com',
      password: 'password123',
      name: '통합테스트',
    })
    const registeredUser = await (registerHandler as any)(registerEvent)

    expect(registeredUser.email).toBe('integration@test.com')
    expect(registeredUser.role).toBe('MEMBER')
    expect(registeredUser).not.toHaveProperty('password')

    // Step 2: 로그인
    const loginEvent = makeEvent({
      email: 'integration@test.com',
      password: 'password123',
    })
    const loginResult = await (loginHandler as any)(loginEvent)

    expect(loginResult.user).toBeDefined()
    expect(loginResult.user.email).toBe('integration@test.com')
    expect(loginResult.user.role).toBe('MEMBER')

    // Step 3: me 조회
    const meEvent = makeEvent({}, { userId: registeredUser.id })
    const meResult = await (meHandler as any)(meEvent)

    expect(meResult.user).toBeDefined()
    expect(meResult.user.email).toBe('integration@test.com')
    expect(meResult.user.id).toBe(registeredUser.id)
  })

  it('회원가입된 이메일로 재가입 시 409 DUPLICATE_EMAIL을 반환한다', async () => {
    // 첫 번째 회원가입
    const firstEvent = makeEvent({
      email: 'dup@test.com',
      password: 'password123',
      name: '첫번째',
    })
    await (registerHandler as any)(firstEvent)

    // 동일 이메일로 두 번째 회원가입 시도
    const secondEvent = makeEvent({
      email: 'dup@test.com',
      password: 'password123',
      name: '두번째',
    })

    await expect((registerHandler as any)(secondEvent)).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'DUPLICATE_EMAIL' },
    })
  })
})
