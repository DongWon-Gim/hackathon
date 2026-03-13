import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { userId, teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const feedbacks = await prisma.feedback.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { votes: true } },
      votes: { where: { userId }, select: { id: true } }
    }
  })

  return feedbacks.map((f) => ({
    id: f.id,
    content: f.content,
    category: f.category,
    sessionId: f.sessionId,
    createdAt: f.createdAt,
    voteCount: f._count.votes,
    hasVoted: f.votes.length > 0
  }))
})
