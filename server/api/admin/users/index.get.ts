import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const users = await prisma.user.findMany({
    include: {
      team: { select: { name: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      teamId: u.teamId,
      teamName: u.team?.name ?? null
    }))
  }
})
