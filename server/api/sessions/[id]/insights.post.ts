import prisma from '~/server/utils/prisma'
import { generateInsight } from '~/server/utils/claude'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role, teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const feedbacks = await prisma.feedback.findMany({
    where: { sessionId: id },
    select: { category: true, content: true }
  })

  if (feedbacks.length === 0) {
    throw ERROR.VALIDATION_ERROR('피드백이 없어 인사이트를 생성할 수 없습니다')
  }

  let result: { summary: string; issues: { title: string; description: string; action: string }[] }
  try {
    result = await generateInsight(feedbacks)
  } catch {
    // AI 실패 시 피드백 내용 기반 임시 인사이트 생성
    const keeps = feedbacks.filter(f => f.category === 'KEEP')
    const problems = feedbacks.filter(f => f.category === 'PROBLEM')
    const tries = feedbacks.filter(f => f.category === 'TRY')

    result = {
      summary: `총 ${feedbacks.length}개의 피드백이 수집되었습니다. Keep ${keeps.length}개, Problem ${problems.length}개, Try ${tries.length}개입니다. (AI 서비스 일시 오류로 자동 생성된 임시 인사이트입니다)`,
      issues: [
        ...problems.slice(0, 3).map(f => ({
          title: '개선 필요',
          description: f.content,
          action: '팀 논의를 통해 구체적인 개선 방안을 수립하세요'
        })),
        ...tries.slice(0, 2).map(f => ({
          title: '시도 제안',
          description: f.content,
          action: '다음 스프린트에 적용을 검토하세요'
        }))
      ].slice(0, 5)
    }

    if (result.issues.length === 0) {
      result.issues = [{
        title: '피드백 검토 필요',
        description: `${feedbacks.length}개의 피드백이 제출되었습니다`,
        action: '팀원들과 함께 피드백을 검토하고 개선점을 도출하세요'
      }]
    }
  }

  const insight = await prisma.insight.create({
    data: {
      summary: result.summary,
      issues: JSON.stringify(result.issues),
      sessionId: id
    }
  })

  return {
    ...insight,
    issues: result.issues
  }
})
