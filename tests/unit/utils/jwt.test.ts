/**
 * 단위 테스트: JWT 유틸리티 (server/utils/jwt.ts)
 * 관련 기능: FEAT-000 (인증 공통)
 */
import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from '~/server/utils/jwt'
import { createExpiredToken, createInvalidToken } from '../../helpers/auth'

describe('JWT 유틸리티', () => {
  describe('signToken (토큰 생성)', () => {
    it('유효한 페이로드로 JWT 토큰을 생성한다', () => {
      const payload = { userId: 'user1', role: 'MEMBER' as const, teamId: 'team-1' }
      const token = signToken(payload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT 형식: header.payload.signature
    })

    it('teamId가 null인 페이로드로도 토큰을 생성한다', () => {
      const payload = { userId: 'user1', role: 'ADMIN' as const, teamId: null }
      const token = signToken(payload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyToken (토큰 검증)', () => {
    // TC-043: JWT 토큰 생성 후 검증 시 동일한 페이로드 반환
    it('[TC-043] JWT 토큰 생성 후 검증 시 동일한 페이로드를 반환한다', () => {
      const payload = { userId: 'user1', role: 'MEMBER' as const, teamId: 'team-1' }
      const token = signToken(payload)
      const decoded = verifyToken(token)
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.role).toBe(payload.role)
      expect(decoded.teamId).toBe(payload.teamId)
    })

    it('LEADER 역할 토큰을 생성하고 검증한다', () => {
      const payload = { userId: 'leader-1', role: 'LEADER' as const, teamId: 'team-1' }
      const token = signToken(payload)
      const decoded = verifyToken(token)
      expect(decoded.userId).toBe('leader-1')
      expect(decoded.role).toBe('LEADER')
    })

    // TC-044: 만료된 JWT 토큰 검증 시 에러 발생
    it('[TC-044] 만료된 JWT 토큰 검증 시 에러를 발생시킨다', () => {
      const expiredToken = createExpiredToken({ userId: 'user1', role: 'MEMBER', teamId: 'team-1' })
      expect(() => verifyToken(expiredToken)).toThrow()
    })

    // TC-045: 변조된 JWT 토큰 검증 시 에러 발생
    it('[TC-045] 변조된 JWT 토큰 검증 시 에러를 발생시킨다', () => {
      const invalidToken = createInvalidToken()
      expect(() => verifyToken(invalidToken)).toThrow()
    })

    // 경계값: null 또는 빈 문자열 토큰
    it('[EDGE] null 토큰 검증 시 에러를 발생시킨다', () => {
      expect(() => verifyToken(null as any)).toThrow()
    })

    // 경계값: 형식이 잘못된 토큰 (JWT 구조가 아님)
    it('[EDGE] 형식이 잘못된 토큰 검증 시 에러를 발생시킨다', () => {
      expect(() => verifyToken('not-a-jwt')).toThrow()
    })

    it('[EDGE] 빈 문자열 토큰 검증 시 에러를 발생시킨다', () => {
      expect(() => verifyToken('')).toThrow()
    })
  })
})
