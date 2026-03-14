import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  if (!teamId) throw ERROR.FORBIDDEN()

  const members = await prisma.user.findMany({
    where: { teamId, isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' }
  })

  return members
})
