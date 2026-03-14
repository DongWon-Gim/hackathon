import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role, teamId } = event.context.auth
  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const insight = await prisma.insight.findFirst({
    where: { sessionId: id },
    orderBy: { createdAt: 'desc' }
  })
  if (!insight) throw ERROR.NOT_FOUND('인사이트')

  await prisma.insight.delete({ where: { id: insight.id } })

  return { ok: true }
})
