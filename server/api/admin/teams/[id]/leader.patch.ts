import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const body = await readBody(event)
  const { userId } = body ?? {}

  if (!userId || typeof userId !== 'string') {
    throw ERROR.VALIDATION_ERROR('userId는 필수입니다')
  }

  const team = await prisma.team.findUnique({ where: { id } })
  if (!team) throw ERROR.NOT_FOUND('팀')

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) throw ERROR.NOT_FOUND('사용자')

  if (targetUser.teamId !== id) throw ERROR.TEAM_MISMATCH()

  // 기존 팀장 → MEMBER로 강등
  await prisma.user.updateMany({
    where: { teamId: id, role: 'LEADER' },
    data: { role: 'MEMBER' }
  })

  // 대상 사용자 → LEADER로 승격
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'LEADER' }
  })

  return { message: '팀장이 변경되었습니다' }
})
