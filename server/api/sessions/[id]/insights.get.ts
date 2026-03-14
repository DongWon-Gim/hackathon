import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  const insight = await prisma.insight.findFirst({
    where: { sessionId: id },
    orderBy: { createdAt: 'desc' }
  })

  if (!insight) return null

  let issues: unknown[]
  try {
    issues = JSON.parse(insight.issues)
  } catch {
    issues = []
  }
  return { ...insight, issues }
})
