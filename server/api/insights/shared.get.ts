import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const insights = await prisma.insight.findMany({
    where: { isShared: true },
    orderBy: { createdAt: 'desc' },
    include: {
      session: {
        select: {
          id: true, title: true, projectName: true, periodStart: true, periodEnd: true,
          team: { select: { name: true } }
        }
      }
    }
  })

  return insights.map((i) => {
    let issues: unknown[]
    try {
      issues = JSON.parse(i.issues)
    } catch {
      issues = []
    }
    return {
      id: i.id,
      summary: i.summary,
      issues,
      sessionId: i.sessionId,
      createdAt: i.createdAt,
      session: {
        id: i.session.id,
        title: i.session.title,
        projectName: i.session.projectName,
        teamName: i.session.team.name,
        periodStart: i.session.periodStart,
        periodEnd: i.session.periodEnd
      }
    }
  })
})
