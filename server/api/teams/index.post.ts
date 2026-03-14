import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const body = await readBody(event)
  const { name } = body ?? {}

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw ERROR.VALIDATION_ERROR('팀 이름은 필수입니다')
  }

  const team = await prisma.team.create({
    data: { name: name.trim() }
  })

  return {
    id: team.id,
    name: team.name,
    inviteCode: team.inviteCode,
    createdAt: team.createdAt
  }
})
