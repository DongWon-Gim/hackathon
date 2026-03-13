import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const [feedbacks, uniqueParticipants] = await Promise.all([
    prisma.feedback.groupBy({
      by: ['category'],
      where: { sessionId: id },
      _count: true
    }),
    prisma.feedback.findMany({
      where: { sessionId: id, userSessionId: { not: null } },
      select: { userSessionId: true },
      distinct: ['userSessionId']
    })
  ])

  const stats: Record<string, number> = { KEEP: 0, PROBLEM: 0, TRY: 0 }
  feedbacks.forEach((f) => { stats[f.category] = f._count })

  return { ...stats, participants: uniqueParticipants.length }
})
