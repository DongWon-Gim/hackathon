/**
 * 테스트용 피드백 픽스처
 * 중요: userId 필드가 없음 — 익명성 보장 핵심 정책
 */
export const fixtures = {
  keepFeedback1: {
    id: 'feedback-keep-1',
    content: '코드 리뷰 문화가 잘 정착되었습니다.',
    category: 'KEEP' as const,
    sessionId: 'session-active-1',
    // userId: 없음! 익명
    createdAt: new Date('2026-03-13'),
  },
  problemFeedback1: {
    id: 'feedback-problem-1',
    content: '배포 프로세스에 약 30분이 소요되어 개선이 필요합니다.',
    category: 'PROBLEM' as const,
    sessionId: 'session-active-1',
    // userId: 없음! 익명
    createdAt: new Date('2026-03-13'),
  },
  tryFeedback1: {
    id: 'feedback-try-1',
    content: 'CI/CD 파이프라인 최적화를 시도해보면 좋겠습니다.',
    category: 'TRY' as const,
    sessionId: 'session-active-1',
    // userId: 없음! 익명
    createdAt: new Date('2026-03-13'),
  },
}
