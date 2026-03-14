/**
 * 단위 테스트: GET /api/auth/me (현재 사용자 조회)
 * 관련 기능: FEAT-000
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as userFixtures } from '../../../fixtures/users'
import handler from '~/server/api/auth/me.get'

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    resetMocks()
  })

  // 유효한 auth context로 사용자 정보 조회 성공 (팀 있음)
  it('유효한 auth context로 /api/auth/me 호출 시 teamName을 포함한 사용자 정보를 반환한다', async () => {
    const userWithTeam = {
      id: 'member-user-id',
      email: 'member@example.com',
      name: '이개발',
      role: 'MEMBER',
      teamId: 'team-1',
      team: { name: '개발1팀' },
    }
    mockPrisma.user.findUnique.mockResolvedValue(userWithTeam)

    const event = createMockEvent({
      auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
    })
    const result = await handler(event)

    expect(result.user.id).toBe('member-user-id')
    expect(result.user.email).toBe('member@example.com')
    expect(result.user.teamName).toBe('개발1팀')
  })

  // DB에서 사용자를 찾지 못하면 401 UNAUTHORIZED
  it('DB에 사용자가 없으면 401 UNAUTHORIZED를 반환한다', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const event = createMockEvent({
      auth: { userId: 'deleted-user-id', role: 'MEMBER', teamId: null },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHORIZED' },
    })
  })

  // 팀이 없는 사용자 — teamName: null
  it('팀이 없는 사용자의 경우 teamName이 null이다', async () => {
    const userWithoutTeam = {
      id: 'no-team-user-id',
      email: 'noteam@example.com',
      name: '신입',
      role: 'MEMBER',
      teamId: null,
      team: null,
    }
    mockPrisma.user.findUnique.mockResolvedValue(userWithoutTeam)

    const event = createMockEvent({
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })
    const result = await handler(event)

    expect(result.user.teamName).toBeNull()
  })

  // auth context의 userId가 prisma 쿼리에 올바르게 사용된다
  it('auth context의 userId가 prisma.user.findUnique 쿼리에 사용된다', async () => {
    const user = {
      id: 'leader-user-id',
      email: 'leader@example.com',
      name: '김팀장',
      role: 'LEADER',
      teamId: 'team-1',
      team: { name: '개발1팀' },
    }
    mockPrisma.user.findUnique.mockResolvedValue(user)

    const event = createMockEvent({
      auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
    })
    await handler(event)

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'leader-user-id' } })
    )
  })

  it('ADMIN 사용자 조회 시 role이 ADMIN으로 반환된다', async () => {
    const adminUser = {
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: '최고관리자',
      role: 'ADMIN',
      teamId: null,
      team: null,
    }
    mockPrisma.user.findUnique.mockResolvedValue(adminUser)

    const event = createMockEvent({
      auth: { userId: 'admin-user-id', role: 'ADMIN', teamId: null },
    })
    const result = await handler(event)

    expect(result.user.role).toBe('ADMIN')
  })
})
