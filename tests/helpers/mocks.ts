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
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  feedback: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  vote: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  insight: {
    findUnique: vi.fn(),
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
  prisma: mockPrisma,
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
