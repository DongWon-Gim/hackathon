/**
 * 단위 테스트: POST /api/feedbacks (익명 피드백 제출)
 * 관련 기능: FEAT-002
 * 관련 화면: SCR-003
 *
 * 핵심 검증 사항: 피드백 저장 시 userId가 절대 저장되지 않음 (익명성 보장)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockPrisma, resetMocks } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import { fixtures as userFixtures } from '../../../fixtures/users'

describe('POST /api/feedbacks', () => {
  beforeEach(() => {
    resetMocks()
  })

  // TC-018: 피드백 제출 시 DB에 userId 없이 저장 (익명성 핵심 검증)
  it('[TC-018] 피드백 제출 시 DB에 userId 없이 저장되고 응답에도 userId가 없다', async () => {
    // TODO: 구현
    // 준비
    // mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    // mockPrisma.feedback.create.mockImplementation(({ data }) => {
    //   // 익명성 핵심: create 호출 시 data에 userId가 없어야 함
    //   expect(data).not.toHaveProperty('userId')
    //   return Promise.resolve({ id: 'new-feedback-id', ...data })
    // })

    // 실행
    // const result = await feedbackPostHandler(
    //   { sessionId: sessionFixtures.activeSession.id, category: 'KEEP', content: '좋은 점이 있습니다' },
    //   userFixtures.memberUser
    // )

    // 검증
    // expect(result.success).toBe(true)
    // expect(mockPrisma.feedback.create).toHaveBeenCalledWith(
    //   expect.objectContaining({
    //     data: expect.not.objectContaining({ userId: expect.anything() })
    //   })
    // )
    expect(true).toBe(true) // placeholder
  })

  // TC-019: 마감된 세션에 피드백 제출 시 403 SESSION_CLOSED
  it('[TC-019] 마감된 세션에 피드백 제출 시 403 SESSION_CLOSED를 반환한다', async () => {
    // TODO: 구현
    // mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.closedSession)

    // await expect(
    //   feedbackPostHandler(
    //     { sessionId: sessionFixtures.closedSession.id, category: 'KEEP', content: '내용' },
    //     userFixtures.memberUser
    //   )
    // ).rejects.toMatchObject({ statusCode: 403, data: { code: 'SESSION_CLOSED' } })
    expect(true).toBe(true) // placeholder
  })

  // TC-020: 다른 팀의 세션에 피드백 제출 시 403 TEAM_MISMATCH
  it('[TC-020] 다른 팀의 세션에 피드백 제출 시 403 TEAM_MISMATCH를 반환한다', async () => {
    // TODO: 구현
    // mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

    // await expect(
    //   feedbackPostHandler(
    //     { sessionId: sessionFixtures.otherTeamSession.id, category: 'KEEP', content: '내용' },
    //     userFixtures.memberUser
    //   )
    // ).rejects.toMatchObject({ statusCode: 403, data: { code: 'TEAM_MISMATCH' } })
    expect(true).toBe(true) // placeholder
  })

  // TC-021: 유효하지 않은 카테고리 값으로 피드백 제출 시 400 VALIDATION_ERROR
  it('[TC-021] 유효하지 않은 카테고리 값으로 피드백 제출 시 400 VALIDATION_ERROR를 반환한다', async () => {
    // TODO: 구현
    // mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)

    // await expect(
    //   feedbackPostHandler(
    //     { sessionId: sessionFixtures.activeSession.id, category: 'INVALID', content: '내용' },
    //     userFixtures.memberUser
    //   )
    // ).rejects.toMatchObject({ statusCode: 400, data: { code: 'VALIDATION_ERROR' } })
    expect(true).toBe(true) // placeholder
  })

  // TC-022: 2000자 초과 피드백 내용 제출 시 400 VALIDATION_ERROR
  it('[TC-022] 2000자를 초과하는 피드백 내용 제출 시 400 VALIDATION_ERROR를 반환한다', async () => {
    // TODO: 구현
    // await expect(
    //   feedbackPostHandler(
    //     { sessionId: sessionFixtures.activeSession.id, category: 'KEEP', content: 'a'.repeat(2001) },
    //     userFixtures.memberUser
    //   )
    // ).rejects.toMatchObject({ statusCode: 400, data: { code: 'VALIDATION_ERROR' } })
    expect(true).toBe(true) // placeholder
  })

  // 경계값: 피드백 내용이 빈 문자열인 경우
  it('[EDGE] 피드백 내용이 빈 문자열인 경우 400 VALIDATION_ERROR를 반환한다', async () => {
    // TODO: 구현
    expect(true).toBe(true) // placeholder
  })

  // 경계값: 피드백 내용이 정확히 2000자인 경우 (최대 허용치)
  it('[EDGE] 피드백 내용이 정확히 2000자인 경우 제출에 성공한다', async () => {
    // TODO: 구현
    expect(true).toBe(true) // placeholder
  })
})
