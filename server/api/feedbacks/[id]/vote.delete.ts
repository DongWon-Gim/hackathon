import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { userId, teamId } = event.context.auth
  const feedbackId = getRouterParam(event, 'id')!

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { session: true }
  })
  if (!feedback) throw ERROR.NOT_FOUND('피드백')
  if (feedback.session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()
  if (feedback.session.status === 'CLOSED') throw ERROR.SESSION_CLOSED()

  const existing = await prisma.vote.findUnique({
    where: { userId_feedbackId: { userId, feedbackId } }
  })
  if (!existing) throw ERROR.NOT_FOUND('투표')

  await prisma.vote.delete({ where: { userId_feedbackId: { userId, feedbackId } } })

  const voteCount = await prisma.vote.count({ where: { feedbackId } })
  return { voteCount }
})
