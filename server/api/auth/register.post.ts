import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'
import { validateEmail, validatePassword, validateRequired, validateMaxLength } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name } = body ?? {}

  validateRequired(email, '이메일')
  validateRequired(password, '비밀번호')
  validateRequired(name, '이름')
  validateEmail(email)
  validatePassword(password)
  validateMaxLength(name, 50, '이름')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw ERROR.DUPLICATE_EMAIL()

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, role: true, teamId: true, createdAt: true }
  })

  return user
})
