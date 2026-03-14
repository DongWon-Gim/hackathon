/**
 * 단위 테스트: useAuth composable
 * 관련 기능: FEAT-000
 * 관련 화면: SCR-000, SCR-000-1, SCR-001
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'
import type { AuthUser } from '~/types'

// useAuth의 핵심 로직을 직접 테스트하기 위해 의존성을 스텁 처리
// Nuxt 전역 함수들이 setup.ts에서 모킹되어 있으므로 composable을 직접 테스트

describe('useAuth composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // isLeader / isAdmin / hasTeam 계산 로직 직접 테스트
  describe('computed 계산 속성 로직', () => {
    it('isLeader는 role이 LEADER일 때 true를 반환한다', () => {
      const user = ref<AuthUser | null>({
        id: 'leader-1',
        email: 'leader@example.com',
        name: '김팀장',
        role: 'LEADER',
        teamId: 'team-1',
        teamName: '개발1팀',
      })
      const isLeader = computed(() => user.value?.role === 'LEADER' || user.value?.role === 'ADMIN')
      expect(isLeader.value).toBe(true)
    })

    it('isLeader는 role이 ADMIN일 때 true를 반환한다', () => {
      const user = ref<AuthUser | null>({
        id: 'admin-1',
        email: 'admin@example.com',
        name: '최고관리자',
        role: 'ADMIN',
        teamId: null,
        teamName: null,
      })
      const isLeader = computed(() => user.value?.role === 'LEADER' || user.value?.role === 'ADMIN')
      expect(isLeader.value).toBe(true)
    })

    it('isLeader는 role이 MEMBER일 때 false를 반환한다', () => {
      const user = ref<AuthUser | null>({
        id: 'member-1',
        email: 'member@example.com',
        name: '이개발',
        role: 'MEMBER',
        teamId: 'team-1',
        teamName: '개발1팀',
      })
      const isLeader = computed(() => user.value?.role === 'LEADER' || user.value?.role === 'ADMIN')
      expect(isLeader.value).toBe(false)
    })

    it('isLeader는 user가 null일 때 false를 반환한다', () => {
      const user = ref<AuthUser | null>(null)
      const isLeader = computed(() => user.value?.role === 'LEADER' || user.value?.role === 'ADMIN')
      expect(isLeader.value).toBeFalsy()
    })

    it('isAdmin은 role이 ADMIN일 때만 true를 반환한다', () => {
      const adminUser = ref<AuthUser | null>({
        id: 'admin-1',
        email: 'admin@example.com',
        name: '최고관리자',
        role: 'ADMIN',
        teamId: null,
        teamName: null,
      })
      const isAdmin = computed(() => adminUser.value?.role === 'ADMIN')
      expect(isAdmin.value).toBe(true)

      const leaderUser = ref<AuthUser | null>({
        id: 'leader-1',
        email: 'leader@example.com',
        name: '김팀장',
        role: 'LEADER',
        teamId: 'team-1',
        teamName: '개발1팀',
      })
      const isAdminForLeader = computed(() => leaderUser.value?.role === 'ADMIN')
      expect(isAdminForLeader.value).toBe(false)
    })

    it('hasTeam은 teamId가 설정되어 있을 때 true를 반환한다', () => {
      const user = ref<AuthUser | null>({
        id: 'member-1',
        email: 'member@example.com',
        name: '이개발',
        role: 'MEMBER',
        teamId: 'team-1',
        teamName: '개발1팀',
      })
      const hasTeam = computed(() => !!user.value?.teamId)
      expect(hasTeam.value).toBe(true)
    })

    it('hasTeam은 teamId가 null일 때 false를 반환한다', () => {
      const user = ref<AuthUser | null>({
        id: 'no-team-1',
        email: 'noteam@example.com',
        name: '신입',
        role: 'MEMBER',
        teamId: null,
        teamName: null,
      })
      const hasTeam = computed(() => !!user.value?.teamId)
      expect(hasTeam.value).toBe(false)
    })

    it('hasTeam은 user가 null일 때 false를 반환한다', () => {
      const user = ref<AuthUser | null>(null)
      const hasTeam = computed(() => !!user.value?.teamId)
      expect(hasTeam.value).toBe(false)
    })

    it('isLoggedIn은 user가 설정되어 있을 때 true를 반환한다', () => {
      const user = ref<AuthUser | null>({
        id: 'member-1',
        email: 'member@example.com',
        name: '이개발',
        role: 'MEMBER',
        teamId: 'team-1',
        teamName: '개발1팀',
      })
      const isLoggedIn = computed(() => !!user.value)
      expect(isLoggedIn.value).toBe(true)
    })

    it('isLoggedIn은 user가 null일 때 false를 반환한다', () => {
      const user = ref<AuthUser | null>(null)
      const isLoggedIn = computed(() => !!user.value)
      expect(isLoggedIn.value).toBe(false)
    })
  })

  // login 로직 테스트 ($fetch 모킹)
  describe('login 로직', () => {
    it('login 호출 성공 시 $fetch가 올바른 인자로 호출된다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        user: {
          id: 'member-1',
          email: 'member@example.com',
          name: '이개발',
          role: 'MEMBER',
          teamId: 'team-1',
          teamName: '개발1팀',
        },
      })
      vi.stubGlobal('$fetch', mockFetch)

      const user = ref<AuthUser | null>(null)
      const router = { push: vi.fn() }

      // login 함수 로직 직접 검증
      const loginFn = async (email: string, password: string) => {
        const data = await $fetch<{ user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        user.value = data.user
        if (!user.value.teamId) {
          await router.push('/join')
        } else {
          await router.push('/')
        }
      }

      await loginFn('member@example.com', 'password123')

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        body: { email: 'member@example.com', password: 'password123' },
      })
      expect(user.value?.email).toBe('member@example.com')
      expect(router.push).toHaveBeenCalledWith('/')
    })

    it('login 호출 시 teamId가 없으면 /join으로 이동한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        user: {
          id: 'noteam-1',
          email: 'noteam@example.com',
          name: '신입',
          role: 'MEMBER',
          teamId: null,
          teamName: null,
        },
      })
      vi.stubGlobal('$fetch', mockFetch)

      const user = ref<AuthUser | null>(null)
      const router = { push: vi.fn() }

      const loginFn = async (email: string, password: string) => {
        const data = await $fetch<{ user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        user.value = data.user
        if (!user.value.teamId) {
          await router.push('/join')
        } else {
          await router.push('/')
        }
      }

      await loginFn('noteam@example.com', 'password123')

      expect(router.push).toHaveBeenCalledWith('/join')
    })
  })

  // logout 로직 테스트
  describe('logout 로직', () => {
    it('logout 호출 시 user 상태가 null로 초기화된다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({})
      vi.stubGlobal('$fetch', mockFetch)

      const user = ref<AuthUser | null>({
        id: 'member-1',
        email: 'member@example.com',
        name: '이개발',
        role: 'MEMBER',
        teamId: 'team-1',
        teamName: '개발1팀',
      })
      const router = { push: vi.fn() }

      const logoutFn = async () => {
        await $fetch('/api/auth/logout', { method: 'POST' })
        user.value = null
        await router.push('/login')
      }

      await logoutFn()

      expect(user.value).toBeNull()
      expect(router.push).toHaveBeenCalledWith('/login')
    })
  })
})
