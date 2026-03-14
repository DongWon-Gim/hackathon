/**
 * 테스트 전역 설정 (vitest setup file)
 */
import { vi } from 'vitest'

// ─── 환경 변수 ───
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = 'file:./test.db'
process.env.TURSO_DATABASE_URL = 'file:./test.db'
process.env.TURSO_AUTH_TOKEN = ''
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

// ─── Nuxt/h3 서버 글로벌 모킹 ───
global.defineEventHandler = (fn: any) => fn
global.readBody = (event: any) => Promise.resolve((event as any)._body ?? {})
global.getRouterParam = (event: any, key: string) => (event as any)._params?.[key]
global.setCookie = vi.fn()
global.getCookie = vi.fn()
global.deleteCookie = vi.fn()
global.setResponseStatus = vi.fn()
global.getRequestURL = vi.fn((event: any) => event._url ?? new URL('http://localhost/api/test'))
global.getRequestHeader = vi.fn((event: any, _key: string) => event._headers?.authorization)
global.createError = ({ statusCode, data }: { statusCode: number; data: any }) => {
  const err: any = new Error(data?.message ?? 'error')
  err.statusCode = statusCode
  err.data = data
  return err
}

// ─── useRuntimeConfig 글로벌 모킹 ───
global.useRuntimeConfig = () => ({
  jwtSecret: 'test-jwt-secret-key-for-testing-only',
  anthropicApiKey: 'test-anthropic-key',
  public: {},
})

// ─── Nuxt 클라이언트 자동 임포트 모킹 ───
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
  useState: vi.fn((key: string, init: () => any) => {
    const { ref } = require('vue')
    return ref(init())
  }),
  readonly: vi.fn((v: any) => v),
}))
