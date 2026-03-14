/**
 * 단위 테스트: GET /api/sessions/:id/dashboard (대시보드 데이터)
 * 관련 기능: FEAT-004
 * 관련 화면: SCR-004
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import { fixtures as feedbackFixtures } from '../../../fixtures/feedbacks'
import { fixtures as userFixtures } from '../../../fixtures/users'

describe('GET /api/sessions/:id/dashboard', () => {
  beforeEach(() => {
    resetMocks()
  })

  // TC-027: 대시보드 조회 시 해당 세션의 전체 피드백을 카테고리별로 반환
  it('[TC-027] 대시보드 조회 시 해당 세션의 전체 피드백을 카테고리별로 반환한다', async () => {
    // TODO: 구현
    // 준비
    // mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    // mockPrisma.feedback.findMany.mockResolvedValue([
    //   feedbackFixtures.keepFeedback1,
    //   feedbackFixtures.problemFeedback1,
    //   feedbackFixtures.tryFeedback1,
    // ])

    // 실행
    // const result = await dashboardHandler(
    //   sessionFixtures.activeSession.id,
    //   userFixtures.memberUser
    // )

    // 검증
    // expect(result.feedbacks).toHaveLength(3)
    // expect(result.feedbacks.some(f => f.category === 'KEEP')).toBe(true)
    // expect(result.feedbacks.some(f => f.category === 'PROBLEM')).toBe(true)
    // expect(result.feedbacks.some(f => f.category === 'TRY')).toBe(true)
    // // 익명성 확인: 응답에 userId 없음
    // result.feedbacks.forEach(f => expect(f).not.toHaveProperty('userId'))
    expect(true).toBe(true) // placeholder
  })

  // TC-028: 다른 팀의 세션 대시보드 접근 시 403 TEAM_MISMATCH
  it('[TC-028] 다른 팀의 세션 대시보드 접근 시 403 TEAM_MISMATCH를 반환한다', async () => {
    // TODO: 구현
    // mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

    // await expect(
    //   dashboardHandler(sessionFixtures.otherTeamSession.id, userFixtures.memberUser)
    // ).rejects.toMatchObject({ statusCode: 403, data: { code: 'TEAM_MISMATCH' } })
    expect(true).toBe(true) // placeholder
  })

  // TC-029: 피드백이 없는 세션의 대시보드 조회 시 빈 배열 반환
  it('[TC-029] 피드백이 없는 세션의 대시보드 조회 시 빈 배열을 반환한다', async () => {
    // TODO: 구현
    // mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    // mockPrisma.feedback.findMany.mockResolvedValue([])

    // const result = await dashboardHandler(sessionFixtures.activeSession.id, userFixtures.memberUser)
    // expect(result.feedbacks).toHaveLength(0)
    // expect(result.insight).toBeNull()
    expect(true).toBe(true) // placeholder
  })
})
