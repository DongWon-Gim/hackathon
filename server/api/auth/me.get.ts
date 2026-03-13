import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, teamId: true }
  })

  if (!user) throw ERROR.UNAUTHORIZED()
  return { user }
})
