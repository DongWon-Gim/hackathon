/**
 * 단위 테스트: POST /api/teams/join (팀 합류)
 * 관련 기능: FEAT-000
 * 관련 화면: SCR-000-2
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as teamFixtures } from '../../../fixtures/teams'
import { fixtures as userFixtures } from '../../../fixtures/users'
import handler from '~/server/api/teams/join.post'

describe('POST /api/teams/join', () => {
  beforeEach(() => {
    resetMocks()
  })

  // TC-010: 유효한 팀 초대 코드로 팀 합류 성공
  it('[TC-010] 유효한 팀 초대 코드로 팀 합류 성공 시 team 정보를 반환한다', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(teamFixtures.team1)
    mockPrisma.user.update.mockResolvedValue({
      ...userFixtures.noTeamUser,
      teamId: 'team-1',
    })

    const event = createMockEvent({
      body: { inviteCode: 'INVITE-CODE-1' },
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })
    const result = await handler(event)

    expect(result.team.id).toBe('team-1')
    expect(result.team.name).toBe('개발1팀')
    expect(result.user.teamId).toBe('team-1')
  })

  // TC-010b: 팀 합류 후 user 정보에 teamName이 포함된다
  it('[TC-010b] 팀 합류 후 user 정보에 teamName이 포함된다', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(teamFixtures.team1)
    mockPrisma.user.update.mockResolvedValue({
      ...userFixtures.noTeamUser,
      teamId: 'team-1',
    })

    const event = createMockEvent({
      body: { inviteCode: 'INVITE-CODE-1' },
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })
    const result = await handler(event)

    expect(result.user.teamName).toBe('개발1팀')
  })

  // TC-011: 잘못된 팀 초대 코드로 합류 시도 시 400 INVALID_INVITE_CODE
  it('[TC-011] 잘못된 팀 초대 코드로 합류 시도 시 400 INVALID_INVITE_CODE 에러를 반환한다', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(null)

    const event = createMockEvent({
      body: { inviteCode: 'invalid-code' },
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'INVALID_INVITE_CODE' },
    })
  })

  // 경계값: 빈 초대 코드
  it('[EDGE] 빈 초대 코드로 합류 시도 시 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { inviteCode: '' },
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  // 경계값: inviteCode 미입력
  it('[EDGE] inviteCode 미입력 시 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: {},
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  // 팀 합류 성공 시 새 토큰이 발급된다 (setCookie 호출)
  it('팀 합류 성공 시 새 JWT 토큰이 발급된다 (setCookie 호출)', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(teamFixtures.team1)
    mockPrisma.user.update.mockResolvedValue({
      ...userFixtures.noTeamUser,
      teamId: 'team-1',
    })

    const event = createMockEvent({
      body: { inviteCode: 'INVITE-CODE-1' },
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })
    await handler(event)

    // setCookie is mocked globally in setup.ts
    expect(global.setCookie).toHaveBeenCalled()
  })

  // prisma.user.update가 올바른 userId로 호출된다
  it('팀 합류 시 올바른 userId로 user를 업데이트한다', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(teamFixtures.team1)
    mockPrisma.user.update.mockResolvedValue({
      ...userFixtures.noTeamUser,
      teamId: 'team-1',
    })

    const event = createMockEvent({
      body: { inviteCode: 'INVITE-CODE-1' },
      auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
    })
    await handler(event)

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'no-team-user-id' },
        data: { teamId: 'team-1' },
      })
    )
  })
})
