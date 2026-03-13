<template>
  <aside
    class="w-56 flex-shrink-0 border-r border-border bg-surface flex flex-col h-screen z-40
           fixed inset-y-0 left-0 transition-transform duration-200
           md:sticky md:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <!-- Logo -->
    <div class="px-4 py-4 border-b border-border flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2 group">
        <div class="w-7 h-7 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center transition-all group-hover:bg-accent/30">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="text-accent">
            <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <span class="font-display text-base font-bold text-ink">RetroLens</span>
      </NuxtLink>
      <button
        class="p-1 rounded-lg hover:bg-elevated text-ink-muted transition-colors md:hidden"
        @click="$emit('close')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
      <!-- 메인 메뉴 -->
      <NuxtLink
        to="/"
        :class="navItemClass(isExactActive('/'))"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        세션 목록
      </NuxtLink>

      <NuxtLink
        to="/insights/shared"
        :class="navItemClass(isPathActive('/insights/shared'))"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        공유 인사이트
      </NuxtLink>

      <NuxtLink
        v-if="isAdmin"
        to="/admin"
        :class="navItemClass(isPathActive('/admin'))"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
        </svg>
        관리자
      </NuxtLink>

      <!-- 세션 하위 메뉴 -->
      <template v-if="sessionId">
        <div class="pt-4 pb-1.5 px-3">
          <p class="text-xs font-medium text-ink-subtle uppercase tracking-widest font-mono">현재 세션</p>
        </div>
        <NuxtLink
          :to="`/session/${sessionId}`"
          :class="navItemClass(isExactActive(`/session/${sessionId}`))"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          피드백 입력
        </NuxtLink>
        <NuxtLink
          :to="`/session/${sessionId}/dashboard`"
          :class="navItemClass(isPathActive(`/session/${sessionId}/dashboard`))"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          대시보드
        </NuxtLink>
      </template>

      <!-- 세션 생성 링크 (리더/어드민, 세션 컨텍스트 밖) -->
      <template v-if="(isLeader || isAdmin) && !sessionId">
        <div class="pt-4 pb-1.5 px-3">
          <p class="text-xs font-medium text-ink-subtle uppercase tracking-widest font-mono">액션</p>
        </div>
        <NuxtLink
          to="/new"
          :class="navItemClass(isExactActive('/new'))"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
          </svg>
          새 세션 만들기
        </NuxtLink>
      </template>
    </nav>

    <!-- User section -->
    <div class="p-3 border-t border-border">
      <div class="px-3 py-2 mb-1">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-sm font-medium text-ink truncate">{{ user?.name }}</span>
          <span :class="roleBadgeClass" class="flex-shrink-0">{{ roleLabel }}</span>
        </div>
        <p class="text-xs text-ink-subtle truncate">{{ user?.email }}</p>
      </div>
      <button
        class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
        @click="logout"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        로그아웃
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
const props = defineProps<{ open?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const { user, isAdmin, isLeader, logout } = useAuth()

watch(() => route.path, () => emit('close'))

const sessionId = computed(() => {
  const match = route.path.match(/^\/session\/([^/]+)/)
  return match ? match[1] : null
})

const roleLabel = computed(() => {
  if (user.value?.role === 'ADMIN') return 'ADMIN'
  if (user.value?.role === 'LEADER') return 'LEADER'
  return 'MEMBER'
})

const roleBadgeClass = computed(() => {
  if (user.value?.role === 'ADMIN') return 'badge-admin'
  if (user.value?.role === 'LEADER') return 'badge-leader'
  return 'badge-member'
})

function isExactActive(path: string) {
  return route.path === path
}

function isPathActive(path: string) {
  return route.path.startsWith(path)
}

function navItemClass(active: boolean) {
  return [
    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full',
    active
      ? 'bg-elevated text-ink font-medium'
      : 'text-ink-muted hover:text-ink hover:bg-elevated/60'
  ]
}
</script>
