import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'
import { signToken } from '~/server/utils/jwt'
import { ERROR } from '~/server/utils/error'
import { validateEmail, validateRequired } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body ?? {}

  validateRequired(email, '이메일')
  validateRequired(password, '비밀번호')
  validateEmail(email)

  const user = await prisma.user.findUnique({ where: { email }, include: { team: { select: { name: true } } } })
  if (!user || !user.isActive) throw ERROR.INVALID_CREDENTIALS()

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw ERROR.INVALID_CREDENTIALS()

  const token = signToken({ userId: user.id, role: user.role as 'ADMIN' | 'LEADER' | 'MEMBER', teamId: user.teamId })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24h
  })

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, teamId: user.teamId, teamName: user.team?.name ?? null }
  }
})
