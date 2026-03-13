import type { AuthUser } from '~/types'

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const initialized = useState<boolean>('auth:initialized', () => false)
  const router = useRouter()

  async function fetchMe() {
    try {
      const data = await $fetch<{ user: AuthUser }>('/api/auth/me')
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function login(email: string, password: string) {
    const data = await $fetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = data.user
    if (!user.value.teamId) {
      await router.push('/join')
    } else {
      await router.push('/')
    }
  }

  async function register(name: string, email: string, password: string) {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    })
    await router.push('/login')
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await router.push('/login')
  }

  async function joinTeam(inviteCode: string) {
    const data = await $fetch<{ user: AuthUser }>('/api/teams/join', {
      method: 'POST',
      body: { inviteCode }
    })
    user.value = data.user
    await router.push('/')
  }

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isLeader = computed(() => user.value?.role === 'LEADER' || user.value?.role === 'ADMIN')
  const hasTeam = computed(() => !!user.value?.teamId)

  return {
    user: readonly(user),
    initialized: readonly(initialized),
    isLoggedIn,
    isAdmin,
    isLeader,
    hasTeam,
    fetchMe,
    login,
    register,
    logout,
    joinTeam
  }
}
