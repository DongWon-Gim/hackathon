/**
 * 단위 테스트: 피드백 API
 * - POST /api/sessions/:id/feedbacks (익명 피드백 제출)
 * - GET /api/sessions/:id/feedbacks (피드백 목록 조회)
 * 관련 기능: FEAT-002
 * 관련 화면: SCR-003
 *
 * 핵심 검증 사항: 피드백 저장 시 userId가 절대 저장되지 않음 (익명성 보장)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import { fixtures as feedbackFixtures } from '../../../fixtures/feedbacks'
import createFeedbackHandler from '~/server/api/sessions/[id]/feedbacks.post'
import listFeedbacksHandler from '~/server/api/sessions/[id]/feedbacks.get'

describe('피드백 API', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('POST /api/sessions/:id/feedbacks (피드백 제출)', () => {
    // TC-018: 피드백 제출 시 DB에 userId 없이 저장 (익명성 핵심 검증)
    it('[TC-018] 피드백 제출 시 DB에 userId 없이 저장되어 익명성이 보장된다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.feedback.create.mockImplementation(({ data }: any) => {
        expect(data).not.toHaveProperty('userId')
        return Promise.resolve({
          id: 'new-feedback-id',
          content: data.content,
          category: data.category,
          sessionId: data.sessionId,
          createdAt: new Date(),
        })
      })

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: '좋은 점이 있습니다', category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await createFeedbackHandler(event)

      expect(result.id).toBe('new-feedback-id')
      expect(result).not.toHaveProperty('userId')
      expect(mockPrisma.feedback.create).toHaveBeenCalledOnce()
      expect(mockPrisma.feedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ userId: expect.anything() }),
        })
      )
    })

    // ACTIVE 세션에 피드백 저장 성공
    it('ACTIVE 상태 세션에 유효한 피드백을 저장한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.feedback.create.mockResolvedValue({
        id: 'feedback-new',
        content: '코드 리뷰 문화가 좋습니다',
        category: 'KEEP',
        sessionId: sessionFixtures.activeSession.id,
        createdAt: new Date(),
      })

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: '코드 리뷰 문화가 좋습니다', category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await createFeedbackHandler(event)

      expect(result.category).toBe('KEEP')
      expect(result.content).toBe('코드 리뷰 문화가 좋습니다')
    })

    // TC-019: 마감된 세션에 피드백 제출 시 403 SESSION_CLOSED
    it('[TC-019] 마감된 세션에 피드백 제출 시 403 SESSION_CLOSED를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.closedSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.closedSession.id },
        body: { content: '내용', category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createFeedbackHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'SESSION_CLOSED' },
      })
    })

    // 다른 팀의 세션에 피드백 제출 시 403 TEAM_MISMATCH
    it('다른 팀의 세션에 피드백 제출 시 403 TEAM_MISMATCH를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.otherTeamSession.id },
        body: { content: '내용', category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createFeedbackHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'TEAM_MISMATCH' },
      })
    })

    // 피드백 내용 미입력 시 400 VALIDATION_ERROR
    it('피드백 내용이 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createFeedbackHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    // 유효하지 않은 카테고리 값으로 피드백 제출 시 400 VALIDATION_ERROR
    it('유효하지 않은 카테고리 값으로 피드백 제출 시 400 VALIDATION_ERROR를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: '내용', category: 'INVALID' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createFeedbackHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    it('PROBLEM 카테고리로 피드백 제출 시 성공한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.feedback.create.mockResolvedValue({
        id: 'feedback-problem',
        content: '개선이 필요합니다',
        category: 'PROBLEM',
        sessionId: sessionFixtures.activeSession.id,
        createdAt: new Date(),
      })

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: '개선이 필요합니다', category: 'PROBLEM' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await createFeedbackHandler(event)

      expect(result.category).toBe('PROBLEM')
    })

    it('TRY 카테고리로 피드백 제출 시 성공한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.feedback.create.mockResolvedValue({
        id: 'feedback-try',
        content: '시도해볼 것이 있습니다',
        category: 'TRY',
        sessionId: sessionFixtures.activeSession.id,
        createdAt: new Date(),
      })

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: '시도해볼 것이 있습니다', category: 'TRY' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await createFeedbackHandler(event)

      expect(result.category).toBe('TRY')
    })

    it('[EDGE] 피드백 내용이 빈 문자열인 경우 400 VALIDATION_ERROR를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: '', category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createFeedbackHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    it('[EDGE] 피드백 내용이 500자를 초과하면 400 VALIDATION_ERROR를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        body: { content: 'a'.repeat(501), category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createFeedbackHandler(event)).rejects.toMatchObject({
        statusCode: 400,
        data: { code: 'VALIDATION_ERROR' },
      })
    })

    it('[EDGE] 세션이 존재하지 않으면 404 NOT_FOUND를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        params: { id: 'nonexistent-session' },
        body: { content: '내용', category: 'KEEP' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(createFeedbackHandler(event)).rejects.toMatchObject({
        statusCode: 404,
        data: { code: 'NOT_FOUND' },
      })
    })
  })

  describe('GET /api/sessions/:id/feedbacks (피드백 목록 조회)', () => {
    it('세션의 피드백 목록을 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.feedback.findMany.mockResolvedValue([
        {
          id: 'feedback-keep-1',
          content: feedbackFixtures.keepFeedback1.content,
          category: 'KEEP',
          sessionId: sessionFixtures.activeSession.id,
          createdAt: new Date(),
          _count: { votes: 2 },
          votes: [{ id: 'vote-1' }],
        },
      ])

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await listFeedbacksHandler(event)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0].voteCount).toBe(2)
      expect(result[0].hasVoted).toBe(true)
    })

    it('조회 결과에 userId 필드가 포함되지 않는다 (익명성 보장)', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
      mockPrisma.feedback.findMany.mockResolvedValue([
        {
          id: 'feedback-1',
          content: '내용',
          category: 'KEEP',
          sessionId: sessionFixtures.activeSession.id,
          createdAt: new Date(),
          _count: { votes: 0 },
          votes: [],
        },
      ])

      const event = createMockEvent({
        params: { id: sessionFixtures.activeSession.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await listFeedbacksHandler(event)

      result.forEach((f: any) => {
        expect(f).not.toHaveProperty('userId')
      })
    })

    it('다른 팀의 세션 피드백 조회 시 403 TEAM_MISMATCH를 반환한다', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

      const event = createMockEvent({
        params: { id: sessionFixtures.otherTeamSession.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(listFeedbacksHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'TEAM_MISMATCH' },
      })
    })
  })
})
