<template>
  <div class="page-container">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <p class="section-label mb-1">{{ user?.name }}의 팀</p>
        <h1 class="page-title">회고 세션</h1>
      </div>
      <NuxtLink v-if="isLeader" to="/new" class="btn-primary">
        + 세션 생성
      </NuxtLink>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="pending" full-page label="세션 목록을 불러오는 중..." />

    <!-- Empty -->
    <EmptyState
      v-else-if="!sessions?.length"
      icon="📋"
      message="아직 회고 세션이 없습니다"
      :sub-message="isLeader ? '첫 회고 세션을 만들어보세요' : '팀장이 세션을 생성하면 여기에 표시됩니다'"
      :action-text="isLeader ? '세션 생성하기' : undefined"
      action-to="/new"
    />

    <!-- Session List -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="session in sessions"
        :key="session.id"
        :to="session.status === 'ACTIVE' ? `/session/${session.id}` : `/session/${session.id}/dashboard`"
        class="card-hover flex items-center justify-between"
      >
        <div>
          <div class="flex items-center gap-2 mb-1">
            <Badge :label="session.status === 'ACTIVE' ? '진행중' : '마감'" :variant="session.status === 'ACTIVE' ? 'active' : 'closed'" />
            <span class="text-xs text-ink-muted font-mono">{{ formatDate(session.createdAt) }}</span>
          </div>
          <h2 class="font-semibold text-ink">{{ session.title }}</h2>
          <p class="text-xs text-ink-muted mt-0.5">{{ session.projectName }}</p>
        </div>
        <svg class="w-4 h-4 text-ink-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Session } from '~/types'

const { user, isLeader } = useAuth()

const { data: sessions, pending } = await useFetch<Session[]>('/api/sessions')

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
</script>
