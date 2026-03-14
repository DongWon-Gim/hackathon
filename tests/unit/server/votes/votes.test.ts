/**
 * 단위 테스트: 투표 API
 * - POST /api/feedbacks/:id/vote (투표)
 * - DELETE /api/feedbacks/:id/vote (투표 취소)
 * 관련 기능: FEAT-006
 * 관련 화면: SCR-004
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as feedbackFixtures } from '../../../fixtures/feedbacks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import votePostHandler from '~/server/api/feedbacks/[id]/vote.post'
import voteDeleteHandler from '~/server/api/feedbacks/[id]/vote.delete'

describe('투표 API', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('POST /api/feedbacks/:id/vote (투표)', () => {
    // TC-034: 처음 투표 시 Vote 레코드가 생성되고 투표 수가 반환됨
    it('[TC-034] 처음 투표 시 Vote 레코드가 생성되고 voteCount를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue({
        ...feedbackFixtures.problemFeedback1,
        session: { teamId: 'team-1', status: 'ACTIVE' },
      })
      mockPrisma.vote.findUnique.mockResolvedValue(null)
      mockPrisma.vote.create.mockResolvedValue({
        id: 'vote-1',
        userId: 'member-user-id',
        feedbackId: feedbackFixtures.problemFeedback1.id,
        createdAt: new Date(),
      })
      mockPrisma.vote.count.mockResolvedValue(1)

      const event = createMockEvent({
        params: { id: feedbackFixtures.problemFeedback1.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await votePostHandler(event)

      expect(result.voteCount).toBe(1)
      expect(mockPrisma.vote.create).toHaveBeenCalledOnce()
      expect(mockPrisma.vote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'member-user-id', feedbackId: feedbackFixtures.problemFeedback1.id },
        })
      )
    })

    // TC-035: 동일 피드백에 중복 투표 시도 시 409 DUPLICATE_VOTE
    it('[TC-035] 동일 피드백에 중복 투표 시도 시 409 DUPLICATE_VOTE를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue({
        ...feedbackFixtures.problemFeedback1,
        session: { teamId: 'team-1', status: 'ACTIVE' },
      })
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'existing-vote',
        userId: 'member-user-id',
        feedbackId: feedbackFixtures.problemFeedback1.id,
      })

      const event = createMockEvent({
        params: { id: feedbackFixtures.problemFeedback1.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(votePostHandler(event)).rejects.toMatchObject({
        statusCode: 409,
        data: { code: 'DUPLICATE_VOTE' },
      })
    })

    // 존재하지 않는 피드백에 투표 시도 시 404 NOT_FOUND
    it('[EDGE] 존재하지 않는 피드백에 투표 시도 시 404 NOT_FOUND를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        params: { id: 'nonexistent-feedback' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(votePostHandler(event)).rejects.toMatchObject({
        statusCode: 404,
        data: { code: 'NOT_FOUND' },
      })
    })

    // 마감된 세션의 피드백에 투표 시도 시 403 SESSION_CLOSED
    it('[EDGE] 마감된 세션의 피드백에 투표 시도 시 403 SESSION_CLOSED를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue({
        ...feedbackFixtures.problemFeedback1,
        session: { teamId: 'team-1', status: 'CLOSED' },
      })

      const event = createMockEvent({
        params: { id: feedbackFixtures.problemFeedback1.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(votePostHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'SESSION_CLOSED' },
      })
    })

    // 다른 팀의 피드백에 투표 시도 시 403 TEAM_MISMATCH
    it('[EDGE] 다른 팀의 피드백에 투표 시도 시 403 TEAM_MISMATCH를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue({
        ...feedbackFixtures.problemFeedback1,
        session: { teamId: 'team-2', status: 'ACTIVE' },
      })

      const event = createMockEvent({
        params: { id: feedbackFixtures.problemFeedback1.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(votePostHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'TEAM_MISMATCH' },
      })
    })
  })

  describe('DELETE /api/feedbacks/:id/vote (투표 취소)', () => {
    // TC-036: 투표 취소 시 Vote 레코드가 삭제됨
    it('[TC-036] 투표 취소 시 Vote 레코드가 삭제되고 voteCount를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue({
        ...feedbackFixtures.problemFeedback1,
        session: { teamId: 'team-1', status: 'ACTIVE' },
      })
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'existing-vote',
        userId: 'member-user-id',
        feedbackId: feedbackFixtures.problemFeedback1.id,
      })
      mockPrisma.vote.delete.mockResolvedValue({ id: 'existing-vote' })
      mockPrisma.vote.count.mockResolvedValue(0)

      const event = createMockEvent({
        params: { id: feedbackFixtures.problemFeedback1.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })
      const result = await voteDeleteHandler(event)

      expect(result.voteCount).toBe(0)
      expect(mockPrisma.vote.delete).toHaveBeenCalledOnce()
    })

    // 투표하지 않은 피드백에 투표 취소 시도 시 404 NOT_FOUND
    it('[EDGE] 투표하지 않은 피드백에 투표 취소 시도 시 404 NOT_FOUND를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue({
        ...feedbackFixtures.problemFeedback1,
        session: { teamId: 'team-1', status: 'ACTIVE' },
      })
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        params: { id: feedbackFixtures.problemFeedback1.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(voteDeleteHandler(event)).rejects.toMatchObject({
        statusCode: 404,
        data: { code: 'NOT_FOUND' },
      })
    })

    // 존재하지 않는 피드백에 투표 취소 시도 시 404 NOT_FOUND
    it('[EDGE] 존재하지 않는 피드백에 투표 취소 시도 시 404 NOT_FOUND를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        params: { id: 'nonexistent-feedback' },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(voteDeleteHandler(event)).rejects.toMatchObject({
        statusCode: 404,
        data: { code: 'NOT_FOUND' },
      })
    })

    // 마감된 세션의 피드백 투표 취소 시도 시 403 SESSION_CLOSED
    it('[EDGE] 마감된 세션의 피드백 투표 취소 시도 시 403 SESSION_CLOSED를 반환한다', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue({
        ...feedbackFixtures.problemFeedback1,
        session: { teamId: 'team-1', status: 'CLOSED' },
      })

      const event = createMockEvent({
        params: { id: feedbackFixtures.problemFeedback1.id },
        auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
      })

      await expect(voteDeleteHandler(event)).rejects.toMatchObject({
        statusCode: 403,
        data: { code: 'SESSION_CLOSED' },
      })
    })
  })
})
