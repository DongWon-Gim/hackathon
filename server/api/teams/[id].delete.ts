import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const team = await prisma.team.findUnique({ where: { id } })
  if (!team) throw ERROR.NOT_FOUND('팀')

  await prisma.team.delete({ where: { id } })

  return { message: '팀이 삭제되었습니다' }
})
