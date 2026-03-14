/**
 * 통합 테스트: 익명 피드백 제출 플로우
 * 관련 기능: FEAT-002
 * 관련 화면: SCR-003
 *
 * 핵심 검증: DB에 저장된 Feedback 레코드에 userId가 없음을 실제 DB로 검증한다.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { testPrisma, clearDatabase, disconnectDatabase } from '../../helpers/db'

vi.mock('~/server/utils/prisma', () => ({ default: testPrisma }))

import feedbackPostHandler from '~/server/api/sessions/[id]/feedbacks.post'

/** h3 이벤트 mock 헬퍼 */
function makeEvent(
  body: Record<string, unknown>,
  params: Record<string, string> = {},
  authContext: Record<string, unknown> = {}
) {
  return {
    _body: body,
    _params: params,
    context: { auth: authContext },
  }
}

describe('익명 피드백 제출 통합 테스트', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  // TC-023: 동일 세션에 카테고리별 다중 피드백 제출 시 모두 저장됨
  it('[TC-023] 동일 세션에 카테고리별 다중 피드백 제출 시 모두 저장된다', async () => {
    // Step 1: 테스트 데이터 설정
    const team = await testPrisma.team.create({
      data: { name: '테스트팀', inviteCode: 'TEST-CODE-001' },
    })
    const user = await testPrisma.user.create({
      data: {
        email: 'test@test.com',
        password: 'hashed_password',
        name: '테스트',
        role: 'MEMBER',
        teamId: team.id,
      },
    })
    const session = await testPrisma.session.create({
      data: {
        title: 'Test Session',
        projectName: 'Test Project',
        teamId: team.id,
        creatorId: user.id,
      },
    })

    const authContext = { userId: user.id, role: 'MEMBER', teamId: team.id }

    // Step 2: 카테고리별 피드백 3개 제출
    const feedbackInputs = [
      { category: 'KEEP', content: 'Keep 피드백 내용' },
      { category: 'PROBLEM', content: 'Problem 피드백 내용' },
      { category: 'TRY', content: 'Try 피드백 내용' },
    ]

    for (const input of feedbackInputs) {
      const event = makeEvent(
        { content: input.content, category: input.category },
        { id: session.id },
        authContext
      )
      await (feedbackPostHandler as any)(event)
    }

    // Step 3: DB 직접 검증
    const feedbacks = await testPrisma.feedback.findMany({
      where: { sessionId: session.id },
    })

    expect(feedbacks).toHaveLength(3)

    // 카테고리 검증
    const categories = feedbacks.map((f: any) => f.category)
    expect(categories).toContain('KEEP')
    expect(categories).toContain('PROBLEM')
    expect(categories).toContain('TRY')

    // 익명성 핵심 검증: 어떤 피드백 레코드에도 userId 속성이 없어야 함
    feedbacks.forEach((f: any) => {
      expect(f).not.toHaveProperty('userId')
    })
  })

  it('DB 스키마 레벨에서 Feedback 테이블에 userId 컬럼이 없음을 검증한다', async () => {
    // 피드백을 직접 생성하여 반환된 객체에 userId 필드가 없는지 검증
    const team = await testPrisma.team.create({
      data: { name: '스키마검증팀', inviteCode: 'SCHEMA-CODE-001' },
    })
    const user = await testPrisma.user.create({
      data: {
        email: 'schema@test.com',
        password: 'hashed_password',
        name: '스키마테스터',
        role: 'MEMBER',
        teamId: team.id,
      },
    })
    const session = await testPrisma.session.create({
      data: {
        title: 'Schema Test Session',
        projectName: 'Schema Project',
        teamId: team.id,
        creatorId: user.id,
      },
    })

    const feedback = await testPrisma.feedback.create({
      data: {
        content: '익명성 검증용 피드백',
        category: 'KEEP',
        sessionId: session.id,
      },
    })

    // Prisma 스키마에 userId 필드가 없으므로 반환 객체에도 없어야 함
    expect(feedback).not.toHaveProperty('userId')

    // 존재해야 하는 필드 검증
    expect(feedback).toHaveProperty('id')
    expect(feedback).toHaveProperty('content')
    expect(feedback).toHaveProperty('category')
    expect(feedback).toHaveProperty('sessionId')
    expect(feedback).toHaveProperty('createdAt')
  })
})
