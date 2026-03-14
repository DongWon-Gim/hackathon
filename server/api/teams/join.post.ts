import prisma from '~/server/utils/prisma'
import { signToken } from '~/server/utils/jwt'
import { ERROR } from '~/server/utils/error'
import { validateRequired } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const body = await readBody(event)
  const { inviteCode } = body ?? {}

  validateRequired(inviteCode, '팀 코드')

  const team = await prisma.team.findUnique({ where: { inviteCode } })
  if (!team) throw ERROR.INVALID_INVITE_CODE()

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { teamId: team.id },
    select: { id: true, email: true, name: true, role: true, teamId: true }
  })

  // teamId가 반영된 새 토큰 발급
  const token = signToken({ userId: updated.id, role: updated.role as 'ADMIN' | 'LEADER' | 'MEMBER', teamId: updated.teamId })
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  })

  return { user: { ...updated, teamName: team.name }, team: { id: team.id, name: team.name } }
})
