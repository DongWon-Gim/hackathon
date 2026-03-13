import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role, teamId } = event.context.auth
  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const insightId = getRouterParam(event, 'id')!
  const { isShared } = await readBody<{ isShared: boolean }>(event)

  const insight = await prisma.insight.findUnique({
    where: { id: insightId },
    include: { session: true }
  })
  if (!insight) throw ERROR.NOT_FOUND('인사이트')
  if (insight.session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const updated = await prisma.insight.update({
    where: { id: insightId },
    data: { isShared }
  })

  return { isShared: updated.isShared }
})
