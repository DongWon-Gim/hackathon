/**
 * 테스트용 JWT 생성 헬퍼
 */
import jwt from 'jsonwebtoken'

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'

export interface TestTokenPayload {
  userId: string
  role: 'ADMIN' | 'LEADER' | 'MEMBER'
  teamId?: string | null
}

/**
 * 테스트용 유효한 JWT 토큰 생성
 */
export function createTestToken(payload: TestTokenPayload): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' })
}

/**
 * 만료된 JWT 토큰 생성
 */
export function createExpiredToken(payload: TestTokenPayload): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '-1s' })
}

/**
 * 잘못된 서명의 JWT 토큰 생성
 */
export function createInvalidToken(): string {
  return jwt.sign({ userId: 'test' }, 'wrong-secret', { expiresIn: '1h' })
}

// 테스트용 사용자 토큰 프리셋
export const TEST_TOKENS = {
  admin: createTestToken({ userId: 'admin-user-id', role: 'ADMIN', teamId: null }),
  leader: createTestToken({ userId: 'leader-user-id', role: 'LEADER', teamId: 'team-1' }),
  member: createTestToken({ userId: 'member-user-id', role: 'MEMBER', teamId: 'team-1' }),
  memberNoTeam: createTestToken({ userId: 'no-team-user-id', role: 'MEMBER', teamId: null }),
}
