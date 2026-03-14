import prisma from '~/server/utils/prisma'
import { generateInsight } from '~/server/utils/claude'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role, teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()

  // readBody는 스트림 소비 전에 먼저 호출
  const body: { useFallback?: boolean } = (await readBody(event).catch(() => null)) ?? {}

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

  // useFallback=true: 임시 인사이트 저장 요청
  if (body.useFallback) {
    const result = buildFallback(feedbacks)
    const insight = await prisma.insight.create({
      data: { summary: result.summary, issues: JSON.stringify(result.issues), sessionId: id }
    })
    return { ...insight, issues: result.issues, isFallback: false }
  }

  // AI 호출
  try {
    const result = await generateInsight(feedbacks)
    const insight = await prisma.insight.create({
      data: { summary: result.summary, issues: JSON.stringify(result.issues), sessionId: id }
    })
    return { ...insight, issues: result.issues, isFallback: false }
  } catch {
    // AI 실패 → 저장 없이 임시 프리뷰 반환
    return { isFallback: true, preview: buildFallback(feedbacks) }
  }
})

function buildFallback(feedbacks: { category: string; content: string }[]) {
  const keeps = feedbacks.filter(f => f.category === 'KEEP')
  const problems = feedbacks.filter(f => f.category === 'PROBLEM')
  const tries = feedbacks.filter(f => f.category === 'TRY')

  const issues = [
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

  return {
    summary: `총 ${feedbacks.length}개의 피드백이 수집되었습니다. Keep ${keeps.length}개, Problem ${problems.length}개, Try ${tries.length}개입니다.`,
    issues: issues.length > 0 ? issues : [{
      title: '피드백 검토 필요',
      description: `${feedbacks.length}개의 피드백이 제출되었습니다`,
      action: '팀원들과 함께 피드백을 검토하고 개선점을 도출하세요'
    }]
  }
}
