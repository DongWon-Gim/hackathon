import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: {
          members: true,
          sessions: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return {
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      createdAt: team.createdAt,
      memberCount: team._count.members,
      sessionCount: team._count.sessions
    }))
  }
})
