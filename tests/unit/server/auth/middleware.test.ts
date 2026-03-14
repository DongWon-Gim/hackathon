/**
 * 단위 테스트: server/middleware/auth.ts (JWT 인증 미들웨어)
 * 관련 기능: FEAT-000 (인증 공통)
 *
 * 모든 /api/* 라우트에 적용되는 인증 미들웨어를 검증한다.
 * 공개 라우트(/api/auth/register, /api/auth/login)는 인증을 스킵한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockPrisma, resetMocks } from '../../../helpers/mocks'
import { signToken } from '~/server/utils/jwt'
import handler from '~/server/middleware/auth'

function makeEvent(pathname: string, cookie?: string, authHeader?: string) {
  // global.getRequestURL/getCookie/getRequestHeader are vi.fn() from setup.ts
  vi.mocked(global.getRequestURL).mockReturnValue(new URL(`http://localhost${pathname}`))
  vi.mocked(global.getCookie).mockReturnValue(cookie)
  vi.mocked(global.getRequestHeader).mockReturnValue(authHeader)
  return { context: {} as any }
}

describe('JWT 인증 미들웨어', () => {
  beforeEach(() => {
    resetMocks()
    vi.mocked(global.getRequestURL).mockReset()
    vi.mocked(global.getCookie).mockReset()
    vi.mocked(global.getRequestHeader).mockReset()
  })

  it('공개 라우트(/api/auth/login)는 인증 없이 통과한다', async () => {
    const event = makeEvent('/api/auth/login')
    await expect(handler(event as any)).resolves.toBeUndefined()
  })

  it('공개 라우트(/api/auth/register)는 인증 없이 통과한다', async () => {
    const event = makeEvent('/api/auth/register')
    await expect(handler(event as any)).resolves.toBeUndefined()
  })

  it('/api/* 라우트에 토큰이 없으면 401 UNAUTHORIZED를 던진다', async () => {
    const event = makeEvent('/api/sessions')
    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('유효한 쿠키 토큰으로 인증 시 event.context.auth가 설정된다', async () => {
    const token = signToken({ userId: 'user-1', role: 'MEMBER', teamId: 'team-1' })
    mockPrisma.user.findUnique.mockResolvedValue({ isActive: true })

    const event = makeEvent('/api/sessions', token)
    await handler(event as any)

    expect(event.context.auth).toMatchObject({ userId: 'user-1', role: 'MEMBER' })
  })

  it('유효한 Authorization 헤더 토큰으로 인증 시 event.context.auth가 설정된다', async () => {
    const token = signToken({ userId: 'user-2', role: 'LEADER', teamId: 'team-1' })
    mockPrisma.user.findUnique.mockResolvedValue({ isActive: true })

    const event = makeEvent('/api/sessions', undefined, `Bearer ${token}`)
    await handler(event as any)

    expect(event.context.auth).toMatchObject({ userId: 'user-2', role: 'LEADER' })
  })

  it('만료되거나 잘못된 토큰이면 401 UNAUTHORIZED를 던진다', async () => {
    const event = makeEvent('/api/sessions', 'invalid-token-xyz')
    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('비활성화된 계정(isActive: false)이면 401 UNAUTHORIZED를 던진다', async () => {
    const token = signToken({ userId: 'user-3', role: 'MEMBER', teamId: 'team-1' })
    mockPrisma.user.findUnique.mockResolvedValue({ isActive: false })

    const event = makeEvent('/api/sessions', token)
    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('비 /api 경로는 인증을 스킵한다', async () => {
    const event = makeEvent('/some-page')
    await expect(handler(event as any)).resolves.toBeUndefined()
  })
})
