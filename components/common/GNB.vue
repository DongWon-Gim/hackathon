<template>
  <header class="sticky top-0 z-50 border-b border-border bg-base/90 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div class="w-7 h-7 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center transition-all group-hover:bg-accent/30">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="text-accent">
              <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
            </svg>
          </div>
          <span class="font-display text-base font-bold text-ink">RetroLens</span>
        </NuxtLink>

        <!-- Nav -->
        <nav class="flex items-center gap-1">
          <NuxtLink
            to="/"
            class="px-3 py-1.5 rounded-md text-sm text-ink-muted hover:text-ink hover:bg-elevated transition-colors"
            active-class="text-ink bg-elevated"
          >
            홈
          </NuxtLink>
          <NuxtLink
            to="/insights/shared"
            class="px-3 py-1.5 rounded-md text-sm text-ink-muted hover:text-ink hover:bg-elevated transition-colors"
            active-class="text-ink bg-elevated"
          >
            공유 인사이트
          </NuxtLink>
          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            class="px-3 py-1.5 rounded-md text-sm text-ink-muted hover:text-ink hover:bg-elevated transition-colors"
            active-class="text-ink bg-elevated"
          >
            관리자
          </NuxtLink>
        </nav>

        <!-- User -->
        <div class="flex items-center gap-3">
          <div v-if="user" class="hidden sm:flex items-center gap-2">
            <span class="text-xs text-ink-muted font-mono">{{ user.name }}</span>
            <span :class="roleBadgeClass">{{ roleLabel }}</span>
          </div>
          <button
            class="btn-ghost text-xs px-3 py-1.5"
            @click="logout"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, isAdmin, isLeader, logout } = useAuth()

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
</script>
