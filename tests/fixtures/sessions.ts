/**
 * 테스트용 세션 픽스처
 */
export const fixtures = {
  activeSession: {
    id: 'session-active-1',
    title: 'Sprint 12 회고',
    projectName: 'RetroLens',
    status: 'ACTIVE' as const,
    periodStart: new Date('2026-03-01'),
    periodEnd: new Date('2026-03-13'),
    teamId: 'team-1',
    creatorId: 'leader-user-id',
    createdAt: new Date('2026-03-13'),
    updatedAt: new Date('2026-03-13'),
  },
  closedSession: {
    id: 'session-closed-1',
    title: 'Sprint 11 회고',
    projectName: 'RetroLens',
    status: 'CLOSED' as const,
    periodStart: new Date('2026-02-15'),
    periodEnd: new Date('2026-02-28'),
    teamId: 'team-1',
    creatorId: 'leader-user-id',
    createdAt: new Date('2026-02-28'),
    updatedAt: new Date('2026-03-01'),
  },
  otherTeamSession: {
    id: 'session-other-team-1',
    title: 'Sprint 12 회고',
    projectName: '다른 프로젝트',
    status: 'ACTIVE' as const,
    periodStart: null,
    periodEnd: null,
    teamId: 'team-2',
    creatorId: 'other-leader-id',
    createdAt: new Date('2026-03-13'),
    updatedAt: new Date('2026-03-13'),
  },
}
