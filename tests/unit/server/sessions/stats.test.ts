/**
 * 단위 테스트: GET /api/sessions/:id/stats (세션 통계)
 * 관련 기능: FEAT-004
 * 관련 화면: SCR-004
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import handler from '~/server/api/sessions/[id]/stats.get'

describe('GET /api/sessions/:id/stats', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('카테고리별 피드백 수와 참여자 수를 반환한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    mockPrisma.feedback.groupBy.mockResolvedValue([
      { category: 'KEEP', _count: 3 },
      { category: 'PROBLEM', _count: 2 },
      { category: 'TRY', _count: 4 },
    ])
    mockPrisma.feedback.findMany.mockResolvedValue([
      { userSessionId: 'session-a' },
      { userSessionId: 'session-b' },
    ])

    const event = createMockEvent({
      params: { id: 'session-active-1' },
      auth: { userId: 'user-1', role: 'MEMBER', teamId: 'team-1' },
    })
    const result = await handler(event as any)

    expect(result.KEEP).toBe(3)
    expect(result.PROBLEM).toBe(2)
    expect(result.TRY).toBe(4)
    expect(result.participants).toBe(2)
  })

  it('피드백이 없으면 모든 카운트가 0이다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    mockPrisma.feedback.groupBy.mockResolvedValue([])
    mockPrisma.feedback.findMany.mockResolvedValue([])

    const event = createMockEvent({
      params: { id: 'session-active-1' },
      auth: { userId: 'user-1', role: 'MEMBER', teamId: 'team-1' },
    })
    const result = await handler(event as any)

    expect(result.KEEP).toBe(0)
    expect(result.PROBLEM).toBe(0)
    expect(result.TRY).toBe(0)
    expect(result.participants).toBe(0)
  })

  it('세션이 존재하지 않으면 404를 던진다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(null)

    const event = createMockEvent({
      params: { id: 'nonexistent' },
      auth: { userId: 'user-1', role: 'MEMBER', teamId: 'team-1' },
    })

    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('다른 팀의 세션이면 403을 던진다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

    const event = createMockEvent({
      params: { id: 'session-other-team-1' },
      auth: { userId: 'user-1', role: 'MEMBER', teamId: 'team-1' },
    })

    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 403 })
  })
})
