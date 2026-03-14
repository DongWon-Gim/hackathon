import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const actions = await prisma.actionItem.findMany({
    where: { sessionId: id },
    include: { assignee: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
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
    sessionId: a.sessionId,
    issueIndex: a.issueIndex,
    createdAt: a.createdAt
  }))
})
