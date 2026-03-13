import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth

  const insights = await prisma.insight.findMany({
    where: { isShared: true, session: { teamId } },
    orderBy: { createdAt: 'desc' },
    include: {
      session: { select: { id: true, title: true, projectName: true, periodStart: true, periodEnd: true } }
    }
  })

  return insights.map((i) => ({
    id: i.id,
    summary: i.summary,
    issues: JSON.parse(i.issues),
    isShared: i.isShared,
    sessionId: i.sessionId,
    createdAt: i.createdAt,
    session: i.session
  }))
})
