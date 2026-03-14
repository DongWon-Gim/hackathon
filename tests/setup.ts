/**
 * 테스트 전역 설정 (vitest setup file)
 * vitest.config.ts의 setupFiles에 등록한다.
 */
import { vi } from 'vitest'

// 환경 변수 설정 (테스트 전용)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db'
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-anthropic-key'

// Nuxt 자동 임포트 모킹 (단위 테스트 환경에서 Nuxt 런타임 없이 실행)
vi.mock('#app', () => ({
  defineNuxtPlugin: vi.fn(),
  useNuxtApp: vi.fn(() => ({})),
  useRuntimeConfig: vi.fn(() => ({
    jwtSecret: 'test-jwt-secret-key-for-testing-only',
    anthropicApiKey: 'test-anthropic-key',
  })),
  navigateTo: vi.fn(),
  useCookie: vi.fn(() => ({ value: null })),
  useFetch: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))
