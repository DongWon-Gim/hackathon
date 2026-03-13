import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'
import { validateRequired, validateMaxLength } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId, role, teamId } = event.context.auth

  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()
  if (!teamId) throw ERROR.FORBIDDEN()

  const body = await readBody(event)
  const { title, projectName, periodStart, periodEnd } = body ?? {}

  validateRequired(title, '세션 제목')
  validateRequired(projectName, '프로젝트명')
  validateMaxLength(title, 100, '세션 제목')
  validateMaxLength(projectName, 100, '프로젝트명')

  const duplicate = await prisma.session.findFirst({ where: { teamId, title } })
  if (duplicate) throw ERROR.VALIDATION_ERROR('같은 제목의 세션이 이미 존재합니다')

  const session = await prisma.session.create({
    data: {
      title,
      projectName,
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
      teamId,
      creatorId: userId
    }
  })

  return { session }
})
