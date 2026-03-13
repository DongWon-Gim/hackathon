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
    throw ERROR.AI_SERVICE_ERROR()
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
