/**
 * 단위 테스트: GET /api/sessions/:id/insights (인사이트 조회)
 * 관련 기능: FEAT-005
 * 관련 화면: SCR-004
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import handler from '~/server/api/sessions/[id]/insights.get'

const mockInsight = {
  id: 'insight-1',
  sessionId: 'session-closed-1',
  summary: '배포 프로세스 개선이 필요합니다.',
  issues: JSON.stringify([
    { title: '배포 지연', description: '배포에 30분 소요', action: 'CI/CD 최적화' },
  ]),
  isFallback: false,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
}

describe('GET /api/sessions/:id/insights', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('인사이트가 존재하면 issues를 파싱하여 반환한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.closedSession)
    mockPrisma.insight.findFirst.mockResolvedValue(mockInsight)

    const event = createMockEvent({
      params: { id: 'session-closed-1' },
      auth: { userId: 'leader-id', role: 'LEADER', teamId: 'team-1' },
    })
    const result = await handler(event as any)

    expect(result).not.toBeNull()
    expect(result!.summary).toBe('배포 프로세스 개선이 필요합니다.')
    expect(Array.isArray(result!.issues)).toBe(true)
    expect((result!.issues as any[])[0].title).toBe('배포 지연')
  })

  it('인사이트가 없으면 null을 반환한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    mockPrisma.insight.findFirst.mockResolvedValue(null)

    const event = createMockEvent({
      params: { id: 'session-active-1' },
      auth: { userId: 'leader-id', role: 'LEADER', teamId: 'team-1' },
    })
    const result = await handler(event as any)

    expect(result).toBeNull()
  })

  it('세션이 존재하지 않으면 404를 던진다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(null)

    const event = createMockEvent({
      params: { id: 'nonexistent' },
      auth: { userId: 'leader-id', role: 'LEADER', teamId: 'team-1' },
    })

    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('다른 팀의 세션이면 403을 던진다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

    const event = createMockEvent({
      params: { id: 'session-other-team-1' },
      auth: { userId: 'leader-id', role: 'LEADER', teamId: 'team-1' },
    })

    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('issues JSON이 깨진 경우 빈 배열로 폴백한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.closedSession)
    mockPrisma.insight.findFirst.mockResolvedValue({ ...mockInsight, issues: 'invalid-json' })

    const event = createMockEvent({
      params: { id: 'session-closed-1' },
      auth: { userId: 'leader-id', role: 'LEADER', teamId: 'team-1' },
    })
    const result = await handler(event as any)

    expect(result!.issues).toEqual([])
  })
})
