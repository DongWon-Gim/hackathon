import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { teamId } = event.context.auth
  const id = getRouterParam(event, 'id')!

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw ERROR.NOT_FOUND('세션')
  if (session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()

  // 같은 팀의 최근 5개 세션 조회 (현재 세션 포함, createdAt 내림차순)
  const sessions = await prisma.session.findMany({
    where: { teamId: session.teamId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      insights: {
        select: { issues: true }
      }
    }
  })

  // 각 세션의 이슈 파싱
  interface Issue {
    title: string
    description: string
    action: string
  }

  const sessionData = sessions.map((s) => {
    const issues: Issue[] = s.insights.flatMap((insight) => {
      try {
        return JSON.parse(insight.issues) as Issue[]
      } catch {
        return []
      }
    })

    return {
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      status: s.status,
      issues
    }
  })

  // 2개 이상 세션에서 동일 title을 가진 이슈 제목 목록 추출
  const titleCounts = new Map<string, number>()
  for (const s of sessionData) {
    const uniqueTitles = new Set(s.issues.map((issue) => issue.title))
    for (const title of uniqueTitles) {
      titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1)
    }
  }

  const repeatedTitles = Array.from(titleCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([title]) => title)

  return {
    sessions: sessionData,
    repeatedTitles
  }
})
