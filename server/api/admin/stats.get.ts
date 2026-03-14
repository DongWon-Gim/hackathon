import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const [teamCount, userCount, sessionCount, feedbackCount, teams] = await Promise.all([
    prisma.team.count(),
    prisma.user.count(),
    prisma.session.count(),
    prisma.feedback.count(),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        sessions: {
          select: {
            id: true,
            feedbacks: {
              select: { userSessionId: true }
            }
          }
        }
      }
    })
  ])

  const teamStats = teams.map((team) => {
    const sessionCnt = team.sessions.length
    const allFeedbacks = team.sessions.flatMap((s) => s.feedbacks)
    const feedbackCnt = allFeedbacks.length
    const participantIds = new Set(
      allFeedbacks
        .map((f) => f.userSessionId)
        .filter((id): id is string => id !== null)
    )

    return {
      teamId: team.id,
      teamName: team.name,
      sessionCount: sessionCnt,
      feedbackCount: feedbackCnt,
      participantCount: participantIds.size
    }
  })

  return {
    teamCount,
    userCount,
    sessionCount,
    feedbackCount,
    teamStats
  }
})
