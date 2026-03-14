/**
 * 단위 테스트: POST /api/sessions/:id/insights (AI 인사이트 생성)
 * 관련 기능: FEAT-005
 * 관련 화면: SCR-004
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, mockClaudeGenerateInsight, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as sessionFixtures } from '../../../fixtures/sessions'
import { fixtures as feedbackFixtures } from '../../../fixtures/feedbacks'
import handler from '~/server/api/sessions/[id]/insights.post'

const MOCK_INSIGHT_RESPONSE = {
  summary: '배포 프로세스와 코드 리뷰에 대한 개선 요구가 가장 높습니다.',
  issues: [
    { title: '배포 시간 과다', description: '배포에 약 30분 소요', action: 'CI/CD 파이프라인 최적화' },
    { title: '코드 리뷰 지연', description: '리뷰 처리 시간이 길어짐', action: '리뷰 SLA 도입' },
  ],
}

describe('POST /api/sessions/:id/insights', () => {
  beforeEach(() => {
    resetMocks()
  })

  // TC-030: 팀장이 피드백이 있는 세션에서 인사이트 생성 성공
  it('[TC-030] 팀장이 피드백이 있는 세션에서 인사이트 생성 요청 시 성공한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    mockPrisma.feedback.findMany.mockResolvedValue([
      feedbackFixtures.keepFeedback1,
      feedbackFixtures.problemFeedback1,
      feedbackFixtures.tryFeedback1,
    ])
    mockPrisma.insight.findFirst.mockResolvedValue(null)
    mockClaudeGenerateInsight.mockResolvedValue(MOCK_INSIGHT_RESPONSE)
    mockPrisma.insight.create.mockResolvedValue({
      id: 'insight-1',
      summary: MOCK_INSIGHT_RESPONSE.summary,
      issues: JSON.stringify(MOCK_INSIGHT_RESPONSE.issues),
      isShared: false,
      sessionId: sessionFixtures.activeSession.id,
      createdAt: new Date(),
    })

    const event = createMockEvent({
      params: { id: sessionFixtures.activeSession.id },
      body: {},
      auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
    })
    const result = await handler(event)

    expect(result.summary).toBe(MOCK_INSIGHT_RESPONSE.summary)
    expect(result.issues).toEqual(MOCK_INSIGHT_RESPONSE.issues)
    expect(result.isFallback).toBe(false)
  })

  // TC-031: MEMBER 권한으로 인사이트 생성 시도 시 403 FORBIDDEN
  it('[TC-031] 팀원(MEMBER) 권한으로 인사이트 생성 시도 시 403 FORBIDDEN을 반환한다', async () => {
    const event = createMockEvent({
      params: { id: sessionFixtures.activeSession.id },
      body: {},
      auth: { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 403,
      data: { code: 'FORBIDDEN' },
    })
  })

  // TC-032: Claude API 호출 실패 시 isFallback: true 반환 (fallback preview)
  it('[TC-032] Claude API 호출 실패 시 isFallback: true와 preview를 반환한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    mockPrisma.feedback.findMany.mockResolvedValue([feedbackFixtures.problemFeedback1])
    mockPrisma.insight.findFirst.mockResolvedValue(null)
    mockClaudeGenerateInsight.mockRejectedValue(new Error('Claude API Error'))

    const event = createMockEvent({
      params: { id: sessionFixtures.activeSession.id },
      body: {},
      auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
    })
    const result = await handler(event)

    expect(result.isFallback).toBe(true)
    expect(result.preview).toBeDefined()
    expect(result.preview.summary).toBeDefined()
    expect(result.preview.issues).toBeDefined()
  })

  // TC-033: issues 필드가 JSON으로 저장되고 배열로 파싱 가능하다
  it('[TC-033] 인사이트의 issues 필드가 유효한 JSON 배열로 파싱된다', async () => {
    const insightWithJsonIssues = {
      id: 'insight-1',
      summary: '요약',
      issues: JSON.stringify([{ title: '이슈 1', description: '설명', action: '액션' }]),
      isShared: false,
      sessionId: 'session-active-1',
      createdAt: new Date(),
    }

    const parsedIssues = JSON.parse(insightWithJsonIssues.issues)
    expect(Array.isArray(parsedIssues)).toBe(true)
    expect(parsedIssues[0]).toHaveProperty('title')
    expect(parsedIssues[0]).toHaveProperty('action')
    expect(parsedIssues[0].title).toBe('이슈 1')
  })

  // CLOSED 세션에서도 인사이트 생성 가능
  it('CLOSED 세션에서도 인사이트를 생성할 수 있다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.closedSession)
    mockPrisma.feedback.findMany.mockResolvedValue([
      feedbackFixtures.keepFeedback1,
      feedbackFixtures.problemFeedback1,
    ])
    mockPrisma.insight.findFirst.mockResolvedValue(null)
    mockClaudeGenerateInsight.mockResolvedValue(MOCK_INSIGHT_RESPONSE)
    mockPrisma.insight.create.mockResolvedValue({
      id: 'insight-closed',
      summary: MOCK_INSIGHT_RESPONSE.summary,
      issues: JSON.stringify(MOCK_INSIGHT_RESPONSE.issues),
      isShared: false,
      sessionId: sessionFixtures.closedSession.id,
      createdAt: new Date(),
    })

    const event = createMockEvent({
      params: { id: sessionFixtures.closedSession.id },
      body: {},
      auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
    })
    const result = await handler(event)

    expect(result.summary).toBe(MOCK_INSIGHT_RESPONSE.summary)
  })

  // EDGE: 피드백이 없는 세션에서 인사이트 생성 시도
  it('[EDGE] 피드백이 없는 세션에서 인사이트 생성 시도 시 400 VALIDATION_ERROR를 반환한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    mockPrisma.feedback.findMany.mockResolvedValue([])

    const event = createMockEvent({
      params: { id: sessionFixtures.activeSession.id },
      body: {},
      auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  it('[EDGE] 다른 팀의 세션에서 인사이트 생성 시도 시 403 TEAM_MISMATCH를 반환한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.otherTeamSession)

    const event = createMockEvent({
      params: { id: sessionFixtures.otherTeamSession.id },
      body: {},
      auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 403,
      data: { code: 'TEAM_MISMATCH' },
    })
  })

  it('[EDGE] 이미 인사이트가 존재하는 세션에서 재생성 시도 시 400 VALIDATION_ERROR를 반환한다', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(sessionFixtures.activeSession)
    mockPrisma.feedback.findMany.mockResolvedValue([feedbackFixtures.problemFeedback1])
    mockPrisma.insight.findFirst.mockResolvedValue({ id: 'existing-insight' })

    const event = createMockEvent({
      params: { id: sessionFixtures.activeSession.id },
      body: {},
      auth: { userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })
})
