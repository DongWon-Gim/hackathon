import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role, teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const updated = await prisma.session.update({
    where: { id },
    data: { status: 'CLOSED' }
  })

  return updated
})
