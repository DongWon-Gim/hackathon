/**
 * 단위 테스트: 세션 CRUD API
 * - GET /api/sessions (세션 목록)
 * - POST /api/sessions (세션 생성)
 * - PATCH /api/sessions/:id/close (세션 마감)
 * 관련 기능: FEAT-001
 * 관련 화면: SCR-001, SCR-002
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import createSessionHandler from '~/server/api/sessions/index.post'
import listSessionsHandler from '~/server/api/sessions/index.get'
import closeSessionHandler from '~/server/api/sessions/[id]/close.patch'

describe('세션 API', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('POST /api/sessions (세션 생성)', () => {
    // TC-013: 팀장 권한으로 세션 생성 성공
    it('[TC-013] 팀장 권한으로 세션 생성 시 세션 객체와 ACTIVE 상태를 반환한다', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null)
      mockPrisma.session.create.mockResolvedValue(sessionFixtures.activeSession)

      const event = createMockEvent({
        body: { title: 'Sprint 12 회고', projectName: 'RetroLens' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })
      const result = await createSessionHandler(event)

      expect(result.session.title).toBe('Sprint 12 회고')
      expect(result.session.status).toBe('ACTIVE')
      expect(result.session.id).toBeDefined()
    })

    // TC-014: MEMBER 권한으로 세션 생성 시도 시 403 FORBIDDEN
    it('[TC-014] 팀원(MEMBER) 권한으로 세션 생성 시도 시 403 FORBIDDEN을 반환한다', async () => {
      const event = createMockEvent({
        body: { title: 'Sprint 12 회고', projectName: 'RetroLens' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createSessionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'FORBIDDEN' },
      })
    })

    // TC-015: 세션 제목 없이 세션 생성 시도 시 400 VALIDATION_ERROR
    it('[TC-015] 세션 제목 없이 세션 생성 시도 시 400 VALIDATION_ERROR를 반환한다', async () => {
      const event = createMockEvent({
        body: { projectName: 'RetroLens' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(createSessionHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    it('[EDGE] teamId가 없는 LEADER는 403 FORBIDDEN을 반환한다', async () => {
      const event = createMockEvent({
        body: { title: 'Sprint 12 회고', projectName: 'RetroLens' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: null },
      })

      await expect(createSessionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'FORBIDDEN' },
      })
    })

    it('[EDGE] 동일 제목의 세션이 이미 존재하면 400 VALIDATION_ERROR를 반환한다', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(sessionFixtures.activeSession)

      const event = createMockEvent({
        body: { title: 'Sprint 12 회고', projectName: 'RetroLens' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(createSessionHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    it('ADMIN 권한으로도 세션을 생성할 수 있다', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null)
      mockPrisma.session.create.mockResolvedValue({
        ...sessionFixtures.activeSession,
        creatorId: 'admin-user-id',
      })

      const event = createMockEvent({
        body: { title: 'Admin Sprint 회고', projectName: 'RetroLens' },
        auth: { userId: 'admin-user-id', role: 'ADMIN', teamId: 'team-1' },
      })
      const result = await createSessionHandler(event)

      expect(result.session).toBeDefined()
    })
  })

  describe('PATCH /api/sessions/:id/close (세션 마감)', () => {
    // TC-016: 팀장이 ACTIVE 상태 세션을 마감 처리 시 status가 CLOSED로 변경
    it('[TC-016] 팀장이 ACTIVE 상태 세션을 마감 처리 시 status가 CLOSED로 변경된다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.session.update.mockResolvedValue({
        ...sessionFixtures.activeSession,
        status: 'CLOSED',
      })

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })
      const result = await closeSessionHandler(event)

      expect(result.status).toBe('CLOSED')
      expect(mockPrisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CLOSED' } })
      )
    })

    it('[EDGE] MEMBER 권한으로 세션 마감 시도 시 403 FORBIDDEN을 반환한다', async () => {
      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(closeSessionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'FORBIDDEN' },
      })
    })

    it('[EDGE] 다른 팀의 세션 마감 시도 시 403 TEAM_MISMATCH를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.otherTeamSession.id },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(closeSessionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'TEAM_MISMATCH' },
      })
    })

    it('[EDGE] 존재하지 않는 세션 마감 시도 시 404 NOT_FOUND를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        params: { id: 'nonexistent-id' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(closeSessionHandler(event)).rejects.toMatchObject({
        statusCode: 404,
        data: { code: 'NOT_FOUND' },
      })
    })
  })

  describe('GET /api/sessions (세션 목록)', () => {
    // TC-017: 세션 목록 조회 시 현재 사용자의 팀 세션만 반환
    it('[TC-017] 세션 목록 조회 시 현재 사용자의 팀 세션만 반환한다', async () => {
      const sessionsWithMeta = [
        {
          ...sessionFixtures.activeSession,
          creator: { name: '김팀장' },
          _count: { feedbacks: 3 },
          insights: [],
        },
        {
          ...sessionFixtures.closedSession,
          creator: { name: '김팀장' },
          _count: { feedbacks: 5 },
          insights: [{ id: 'insight-1', isShared: true }],
        },
      ]
      mockPrisma.session.findMany.mockResolvedValue(sessionsWithMeta)

      const event = createMockEvent({
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await listSessionsHandler(event)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result.every((s: any) => s.teamId === 'team-1')).toBe(true)
    })

    it('세션 목록 조회 시 hasInsight와 hasSharedInsight 필드가 포함된다', async () => {
      const sessionsWithMeta = [
        {
          ...sessionFixtures.closedSession,
          creator: { name: '김팀장' },
          _count: { feedbacks: 5 },
          insights: [{ id: 'insight-1', isShared: true }],
        },
      ]
      mockPrisma.session.findMany.mockResolvedValue(sessionsWithMeta)

      const event = createMockEvent({
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await listSessionsHandler(event)

      expect(result[0].hasInsight).toBe(true)
      expect(result[0].hasSharedInsight).toBe(true)
    })

    it('[EDGE] teamId가 없는 사용자가 세션 목록 조회 시 403 FORBIDDEN을 반환한다', async () => {
      const event = createMockEvent({
        auth: { userId: 'no-team-user-id', role: 'MEMBER', teamId: null },
      })

      await expect(listSessionsHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'FORBIDDEN' },
      })
    })
  })
})
