import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const body = await readBody(event)
  const { userId, action, targetTeamId } = body ?? {}

  if (!userId || typeof userId !== 'string') {
    throw ERROR.VALIDATION_ERROR('userId는 필수입니다')
  }
  if (action !== 'move' && action !== 'remove') {
    throw ERROR.VALIDATION_ERROR('action은 move 또는 remove여야 합니다')
  }
  if (action === 'move' && (!targetTeamId || typeof targetTeamId !== 'string')) {
    throw ERROR.VALIDATION_ERROR('move 액션에는 targetTeamId가 필요합니다')
  }

  const team = await prisma.team.findUnique({ where: { id } })
  if (!team) throw ERROR.NOT_FOUND('팀')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ERROR.NOT_FOUND('사용자')

  if (user.teamId !== id) throw ERROR.TEAM_MISMATCH()

  if (action === 'move') {
    const targetTeam = await prisma.team.findUnique({ where: { id: targetTeamId } })
    if (!targetTeam) throw ERROR.NOT_FOUND('이동할 팀')

    await prisma.user.update({
      where: { id: userId },
      data: { teamId: targetTeamId }
    })

    return { message: '팀원이 이동되었습니다' }
  }

  // action === 'remove'
  await prisma.user.update({
    where: { id: userId },
    data: { teamId: null, role: 'MEMBER' }
  })

  return { message: '팀원이 제거되었습니다' }
})
