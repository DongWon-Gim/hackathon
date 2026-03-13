import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth

  if (!teamId) throw ERROR.FORBIDDEN()

  const sessions = await prisma.session.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { name: true } },
      _count: { select: { feedbacks: true } }
    }
  })

  return sessions
})
