import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'
import { validateRequired, validateMaxLength } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()
  if (session.status === 'CLOSED') throw ERROR.SESSION_CLOSED()

  const body = await readBody(event)
  const { content, category, userSessionId } = body ?? {}

  validateRequired(content, '피드백 내용')
  validateRequired(category, '카테고리')
  if (!['KEEP', 'PROBLEM', 'TRY'].includes(category)) {
    throw ERROR.VALIDATION_ERROR('카테고리는 KEEP, PROBLEM, TRY 중 하나여야 합니다')
  }
  validateMaxLength(content, 500, '피드백 내용')

  // userId를 저장하지 않음 — 익명성 보장
  const feedback = await prisma.feedback.create({
    data: { content, category, sessionId: id, userSessionId: userSessionId || null }
  })

  return feedback
})
