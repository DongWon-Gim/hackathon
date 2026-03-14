/**
 * 단위 테스트: 액션 아이템 API (plan-2 변경 반영)
 * - GET /api/sessions/:id/actions (목록 조회 - 단일 쿼리 방식)
 * - POST /api/sessions/:id/actions (생성 - sessionId, issueIndex 저장)
 * - PATCH /api/actions/:id (상태 변경 - session 직접 include)
 * 관련 기능: FEAT-008
 * 관련 화면: SCR-004
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import createActionHandler from '~/server/api/sessions/[id]/actions.post'
import listActionsHandler from '~/server/api/sessions/[id]/actions.get'
import patchActionHandler from '~/server/api/actions/[id].patch'

describe('액션 아이템 API (plan-2)', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('POST /api/sessions/:id/actions (액션 아이템 생성)', () => {
    // TC-039: 팀장이 액션 아이템 생성 시 sessionId가 저장되고 올바른 응답 반환
    it('[TC-039] 팀장이 액션 아이템 생성 시 sessionId가 저장되고 올바른 응답을 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.actionItem.create.mockResolvedValue({
        id: 'action-1',
        content: 'CI/CD 파이프라인 개선',
        sessionId: sessionFixtures.activeSession.id,
        issueIndex: 0,
        status: 'PENDING',
        dueDate: null,
        assigneeId: null,
        feedbackId: null,
        insightId: null,
        assignee: null,
        createdAt: new Date(),
      })

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: 'CI/CD 파이프라인 개선', issueIndex: 0 },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })
      const result = await createActionHandler(event)

      expect(result.sessionId).toBe(sessionFixtures.activeSession.id)
      expect(result.issueIndex).toBe(0)
      expect(result.content).toBe('CI/CD 파이프라인 개선')
      expect(result.status).toBe('PENDING')
    })

    // MEMBER 권한으로 액션 아이템 생성 시도 시 403 FORBIDDEN
    it('[TC-039b] MEMBER 권한으로 액션 아이템 생성 시도 시 403 FORBIDDEN을 반환한다', async () => {
      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: 'CI/CD 파이프라인 개선' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createActionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'FORBIDDEN' },
      })
    })

    // content가 없으면 400 VALIDATION_ERROR
    it('[EDGE] content가 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: {},
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(createActionHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    // issueIndex 없이 생성 (일반 액션 아이템)
    it('[EDGE] issueIndex 없이 액션 아이템 생성 시 issueIndex가 null로 저장된다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.actionItem.create.mockResolvedValue({
        id: 'action-2',
        content: '일반 액션 아이템',
        sessionId: sessionFixtures.activeSession.id,
        issueIndex: null,
        status: 'PENDING',
        dueDate: null,
        assigneeId: null,
        feedbackId: null,
        insightId: null,
        assignee: null,
        createdAt: new Date(),
      })

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: '일반 액션 아이템' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })
      const result = await createActionHandler(event)

      expect(result.issueIndex).toBeNull()
    })

    // 다른 팀 세션에 액션 아이템 생성 시도 시 403 TEAM_MISMATCH
    it('[EDGE] 다른 팀 세션에 액션 아이템 생성 시도 시 403 TEAM_MISMATCH를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.otherTeamSession.id },
        body: { content: 'CI/CD 파이프라인 개선' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(createActionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'TEAM_MISMATCH' },
      })
    })
  })

  describe('GET /api/sessions/:id/actions (액션 아이템 목록)', () => {
    // TC-040: 액션 아이템 목록 조회 시 sessionId 기반 단일 쿼리로 올바른 결과 반환
    it('[TC-040] 액션 아이템 목록 조회 시 sessionId 기반 단일 쿼리로 올바른 결과를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.actionItem.findMany.mockResolvedValue([
        {
          id: 'action-1',
          content: 'CI/CD 파이프라인 개선',
          sessionId: sessionFixtures.activeSession.id,
          issueIndex: 0,
          status: 'PENDING',
          dueDate: null,
          assigneeId: null,
          feedbackId: null,
          insightId: null,
          assignee: { name: '김팀장' },
          createdAt: new Date(),
        },
        {
          id: 'action-2',
          content: '리뷰 SLA 도입',
          sessionId: sessionFixtures.activeSession.id,
          issueIndex: 1,
          status: 'COMPLETED',
          dueDate: null,
          assigneeId: null,
          feedbackId: null,
          insightId: null,
          assignee: null,
          createdAt: new Date(),
        },
      ])

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await listActionsHandler(event)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0].sessionId).toBe(sessionFixtures.activeSession.id)
      expect(result[0].issueIndex).toBe(0)
      // 단일 쿼리 검증: findMany가 1번만 호출되어야 함
      expect(mockPrisma.actionItem.findMany).toHaveBeenCalledOnce()
      expect(mockPrisma.actionItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sessionId: sessionFixtures.activeSession.id } })
      )
    })

    it('assigneeName이 올바르게 매핑된다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.actionItem.findMany.mockResolvedValue([
        {
          id: 'action-1',
          content: 'CI/CD 파이프라인 개선',
          sessionId: sessionFixtures.activeSession.id,
          issueIndex: 0,
          status: 'PENDING',
          dueDate: null,
          assigneeId: 'leader-user-id',
          feedbackId: null,
          insightId: null,
          assignee: { name: '김팀장' },
          createdAt: new Date(),
        },
      ])

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await listActionsHandler(event)

      expect(result[0].assigneeName).toBe('김팀장')
    })
  })

  describe('PATCH /api/actions/:id (상태 변경)', () => {
    // TC-041: 액션 아이템 상태 변경 시 session 직접 포함으로 팀 검증 올바르게 동작
    it('[TC-041] 액션 아이템 상태를 COMPLETED로 변경할 수 있다', async () => {
      mockPrisma.actionItem.findUnique.mockResolvedValue({
        id: 'action-1',
        content: 'CI/CD 파이프라인 개선',
        status: 'PENDING',
        sessionId: sessionFixtures.activeSession.id,
        session: { teamId: 'team-1' },
      })
      mockPrisma.actionItem.update.mockResolvedValue({
        id: 'action-1',
        content: 'CI/CD 파이프라인 개선',
        status: 'COMPLETED',
        sessionId: sessionFixtures.activeSession.id,
        issueIndex: 0,
        dueDate: null,
        assigneeId: null,
        feedbackId: null,
        insightId: null,
        assignee: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const event = createMockEvent({
        params: { id: 'action-1' },
        body: { status: 'COMPLETED' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })
      const result = await patchActionHandler(event)

      expect(result.status).toBe('COMPLETED')
    })

    // TC-042: 다른 팀의 액션 아이템 상태 변경 시도 시 403 TEAM_MISMATCH
    it('[TC-042] 다른 팀의 액션 아이템 상태 변경 시도 시 403 TEAM_MISMATCH를 반환한다', async () => {
      mockPrisma.actionItem.findUnique.mockResolvedValue({
        id: 'action-other',
        content: '타팀 액션',
        status: 'PENDING',
        sessionId: 'session-other-team-1',
        session: { teamId: 'team-2' },
      })

      const event = createMockEvent({
        params: { id: 'action-other' },
        body: { status: 'COMPLETED' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(patchActionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'TEAM_MISMATCH' },
      })
    })

    // 존재하지 않는 액션 아이템 상태 변경 시도 시 404 NOT_FOUND
    it('[EDGE] 존재하지 않는 액션 아이템 상태 변경 시도 시 404 NOT_FOUND를 반환한다', async () => {
      mockPrisma.actionItem.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        params: { id: 'nonexistent-action' },
        body: { status: 'COMPLETED' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(patchActionHandler(event)).rejects.toMatchObject({
        statusCode: 404,
        data: { code: 'NOT_FOUND' },
      })
    })

    // MEMBER 권한으로 상태 변경 시도 시 403 FORBIDDEN
    it('[EDGE] MEMBER 권한으로 액션 아이템 상태 변경 시도 시 403 FORBIDDEN을 반환한다', async () => {
      const event = createMockEvent({
        params: { id: 'action-1' },
        body: { status: 'COMPLETED' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(patchActionHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'FORBIDDEN' },
      })
    })

    // 유효하지 않은 status 값
    it('[EDGE] 유효하지 않은 status 값으로 변경 시도 시 400 VALIDATION_ERROR를 반환한다', async () => {
      mockPrisma.actionItem.findUnique.mockResolvedValue({
        id: 'action-1',
        content: 'CI/CD 파이프라인 개선',
        status: 'PENDING',
        sessionId: sessionFixtures.activeSession.id,
        session: { teamId: 'team-1' },
      })

      const event = createMockEvent({
        params: { id: 'action-1' },
        body: { status: 'INVALID_STATUS' },
        auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
      })

      await expect(patchActionHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })
  })
})
