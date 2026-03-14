import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role, teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const body = await readBody(event)
  const { content, dueDate, assigneeId, feedbackId, insightId } = body ?? {}

  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw ERROR.VALIDATION_ERROR('content는 필수입니다')
  }

  // feedbackId 유효성 검증
  if (feedbackId) {
    const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } })
    if (!feedback) throw ERROR.NOT_FOUND('피드백')
    if (feedback.sessionId !== id) throw ERROR.VALIDATION_ERROR('해당 세션의 피드백이 아닙니다')
  }

  // insightId 유효성 검증
  if (insightId) {
    const insight = await prisma.insight.findUnique({ where: { id: insightId } })
    if (!insight) throw ERROR.NOT_FOUND('인사이트')
    if (insight.sessionId !== id) throw ERROR.VALIDATION_ERROR('해당 세션의 인사이트가 아닙니다')
  }

  // assigneeId 유효성 검증
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
    if (!assignee) throw ERROR.NOT_FOUND('담당자')
  }

  const action = await prisma.actionItem.create({
    data: {
      content: content.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeId: assigneeId ?? undefined,
      feedbackId: feedbackId ?? undefined,
      insightId: insightId ?? undefined
    },
    include: {
      assignee: { select: { name: true } }
    }
  })

  return {
    id: action.id,
    content: action.content,
    status: action.status,
    dueDate: action.dueDate,
    assigneeId: action.assigneeId,
    assigneeName: action.assignee?.name ?? null,
    feedbackId: action.feedbackId,
    insightId: action.insightId,
    createdAt: action.createdAt
  }
})
