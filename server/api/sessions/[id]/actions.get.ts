import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  // 세션의 feedbacks와 insights에 연결된 ActionItem 수집
  const [feedbackActions, insightActions] = await Promise.all([
    prisma.actionItem.findMany({
      where: {
        feedback: { sessionId: id }
      },
      include: {
        assignee: { select: { name: true } }
      }
    }),
    prisma.actionItem.findMany({
      where: {
        insight: { sessionId: id }
      },
      include: {
        assignee: { select: { name: true } }
      }
    })
  ])

  // 중복 제거 (feedbackId와 insightId 모두 있는 경우 방지)
  const seen = new Set<string>()
  const actions = [...feedbackActions, ...insightActions].filter((a) => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  return actions.map((a) => ({
    id: a.id,
    content: a.content,
    status: a.status,
    dueDate: a.dueDate,
    assigneeId: a.assigneeId,
    assigneeName: a.assignee?.name ?? null,
    feedbackId: a.feedbackId,
    insightId: a.insightId,
    createdAt: a.createdAt
  }))
})
