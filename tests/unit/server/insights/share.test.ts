/**
 * 단위 테스트: 인사이트 공유 API
 * - PATCH /api/insights/:id/share (공유 토글)
 * 관련 기능: FEAT-007
 * 관련 화면: SCR-004, SCR-005
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import handler from '~/server/api/insights/[id]/share.patch'

describe('인사이트 공유 API', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('PATCH /api/insights/:id/share', () => {
    // TC-037: 팀장이 인사이트 공유 ON 설정 시 isShared가 true로 변경
    it('[TC-037] 팀장이 인사이트 공유 ON 설정 시 isShared가 true로 변경된다', async () => {
      const insight = {
        id: 'insight-1',
        isShared: false,
        sessionId: sessionFixtures.activeSession.id,
        summary: '요약',
        issues: '[]',
        createdAt: new Date(),
        session: { teamId: 'team-1' },
      }
      mockPrisma.insight.findUnique.mockResolvedValue(insight)
      mockPrisma.insight.update.mockResolvedValue({ ...insight, isShared: true })

      const event = createMockEvent({
        params: { id: 'insight-1' },
        body: { isShared: true },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })
      const result = await handler(event)

      expect(result.isShared).toBe(true)
      expect(mockPrisma.insight.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isShared: true } })
      )
    })

    // 팀장이 인사이트 공유 OFF 설정 시 isShared가 false로 변경
    it('팀장이 인사이트 공유 OFF 설정 시 isShared가 false로 변경된다', async () => {
      const insight = {
        id: 'insight-1',
        isShared: true,
        sessionId: sessionFixtures.activeSession.id,
        summary: '요약',
        issues: '[]',
        createdAt: new Date(),
        session: { teamId: 'team-1' },
      }
      mockPrisma.insight.findUnique.mockResolvedValue(insight)
      mockPrisma.insight.update.mockResolvedValue({ ...insight, isShared: false })

      const event = createMockEvent({
        params: { id: 'insight-1' },
        body: { isShared: false },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })
      const result = await handler(event)

      expect(result.isShared).toBe(false)
    })

    // MEMBER 권한으로 공유 설정 시도 시 403 FORBIDDEN
    it('[EDGE] MEMBER 권한으로 인사이트 공유 설정 시도 시 403 FORBIDDEN을 반환한다', async () => {
      const event = createMockEvent({
        params: { id: 'insight-1' },
        body: { isShared: true },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'FORBIDDEN' },
      })
    })

    // 존재하지 않는 인사이트 공유 시도 시 404 NOT_FOUND
    it('[EDGE] 존재하지 않는 인사이트 공유 시도 시 404 NOT_FOUND를 반환한다', async () => {
      mockPrisma.insight.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        params: { id: 'nonexistent-insight' },
        body: { isShared: true },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 404,
        data: { code: 'NOT_FOUND' },
      })
    })

    // 다른 팀의 인사이트 공유 시도 시 403 TEAM_MISMATCH
    it('[EDGE] 다른 팀의 인사이트 공유 시도 시 403 TEAM_MISMATCH를 반환한다', async () => {
      const insight = {
        id: 'insight-other',
        isShared: false,
        sessionId: 'session-other-team-1',
        summary: '요약',
        issues: '[]',
        createdAt: new Date(),
        session: { teamId: 'team-2' },
      }
      mockPrisma.insight.findUnique.mockResolvedValue(insight)

      const event = createMockEvent({
        params: { id: 'insight-other' },
        body: { isShared: true },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'TEAM_MISMATCH' },
      })
    })

    // isShared가 boolean이 아닌 경우 400 VALIDATION_ERROR
    it('[EDGE] isShared가 boolean이 아닌 값이면 400 VALIDATION_ERROR를 반환한다', async () => {
      const event = createMockEvent({
        params: { id: 'insight-1' },
        body: { isShared: 'yes' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    // ADMIN 권한으로도 인사이트 공유 설정 가능
    it('ADMIN 권한으로도 인사이트 공유를 설정할 수 있다', async () => {
      const insight = {
        id: 'insight-1',
        isShared: false,
        sessionId: sessionFixtures.activeSession.id,
        summary: '요약',
        issues: '[]',
        createdAt: new Date(),
        session: { teamId: 'team-1' },
      }
      mockPrisma.insight.findUnique.mockResolvedValue(insight)
      mockPrisma.insight.update.mockResolvedValue({ ...insight, isShared: true })

      const event = createMockEvent({
        params: { id: 'insight-1' },
        body: { isShared: true },
        auth: { userId: 'admin-user-id', role: 'ADMIN', teamId: 'team-1' },
      })
      const result = await handler(event)

      expect(result.isShared).toBe(true)
    })
  })
})
