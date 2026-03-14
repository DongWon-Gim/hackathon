import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role, teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'LEADER' && role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const action = await prisma.actionItem.findUnique({
    where: { id },
    include: { session: { select: { teamId: true } } }
  })

  if (!action) throw ERROR.NOT_FOUND('액션 아이템')
  if (action.session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const body = await readBody(event)
  const { status, content, dueDate, assigneeId } = body ?? {}

  if (status !== undefined && status !== 'PENDING' && status !== 'COMPLETED') {
    throw ERROR.VALIDATION_ERROR('status는 PENDING 또는 COMPLETED여야 합니다')
  }

  if (content !== undefined && (typeof content !== 'string' || content.trim() === '')) {
    throw ERROR.VALIDATION_ERROR('content는 빈 문자열일 수 없습니다')
  }

  if (assigneeId !== undefined && assigneeId !== null) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
    if (!assignee) throw ERROR.NOT_FOUND('담당자')
  }

  const updateData: {
    status?: string
    content?: string
    dueDate?: Date | null
    assigneeId?: string | null
  } = {}

  if (status !== undefined) updateData.status = status
  if (content !== undefined) updateData.content = content.trim()
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId ?? null

  const updated = await prisma.actionItem.update({
    where: { id },
    data: updateData,
    include: {
      assignee: { select: { name: true } }
    }
  })

  return {
    id: updated.id,
    content: updated.content,
    status: updated.status,
    dueDate: updated.dueDate,
    assigneeId: updated.assigneeId,
    assigneeName: updated.assignee?.name ?? null,
    feedbackId: updated.feedbackId,
    insightId: updated.insightId,
    sessionId: updated.sessionId,
    issueIndex: updated.issueIndex,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  }
})
