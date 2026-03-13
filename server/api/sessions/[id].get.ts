import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      _count: { select: { feedbacks: true } }
    }
  })

  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  return session
})
