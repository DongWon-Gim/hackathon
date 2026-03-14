/**
 * 테스트 공통 모킹 헬퍼
 * prisma 클라이언트, Claude API 클라이언트를 모킹한다.
 */
import { vi } from 'vitest'

// ─── Prisma 모킹 ───
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  team: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  feedback: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  vote: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  insight: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  actionItem: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('~/server/utils/prisma', () => ({
  default: mockPrisma,
}))

// ─── Claude API 모킹 ───
export const mockClaudeTransform = vi.fn()
export const mockClaudeGenerateInsight = vi.fn()

vi.mock('~/server/utils/claude', () => ({
  transformStyle: mockClaudeTransform,
  generateInsight: mockClaudeGenerateInsight,
}))

/**
 * 각 테스트 전 모킹 초기화
 */
export function resetMocks() {
  vi.clearAllMocks()
}

/**
 * 테스트용 h3 이벤트 객체 생성
 */
export function createMockEvent(options: {
  body?: Record<string, any>
  params?: Record<string, string>
  auth?: { userId: string; role: string; teamId: string | null }
} = {}) {
  return {
    _body: options.body ?? {},
    _params: options.params ?? {},
    context: {
      auth: options.auth ?? { userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' },
    },
  }
}
