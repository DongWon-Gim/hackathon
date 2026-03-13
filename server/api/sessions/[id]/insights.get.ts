import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const insights = await prisma.insight.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'desc' }
  })

  return insights.map((i) => ({
    ...i,
    issues: JSON.parse(i.issues)
  }))
})
