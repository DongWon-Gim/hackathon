<template>
  <div class="page-container">
    <div class="mb-8">
      <p class="section-label mb-1">최고관리자</p>
      <h1 class="page-title">관리자 대시보드</h1>
    </div>

    <LoadingSpinner v-if="pending" full-page />

    <template v-else-if="stats">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center p-4">
          <p class="text-2xl font-display font-bold text-accent">{{ stats.teamCount }}</p>
          <p class="text-xs text-ink-muted mt-1">총 팀</p>
        </div>
        <div class="card text-center p-4">
          <p class="text-2xl font-display font-bold text-ink">{{ stats.userCount }}</p>
          <p class="text-xs text-ink-muted mt-1">총 사용자</p>
        </div>
        <div class="card text-center p-4">
          <p class="text-2xl font-display font-bold text-ink">{{ stats.sessionCount }}</p>
          <p class="text-xs text-ink-muted mt-1">총 세션</p>
        </div>
        <div class="card text-center p-4">
          <p class="text-2xl font-display font-bold text-ink">{{ stats.feedbackCount }}</p>
          <p class="text-xs text-ink-muted mt-1">총 피드백</p>
        </div>
      </div>

      <!-- 팀별 통계 -->
      <div class="card overflow-hidden mb-4">
        <div class="px-4 py-3 border-b border-border">
          <p class="section-label">팀별 현황</p>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">팀명</th>
              <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">세션</th>
              <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">피드백</th>
              <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">참여자</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="sortedTeamStats.length > 0">
              <tr
                v-for="row in sortedTeamStats"
                :key="row.teamId"
                class="border-b border-border/50 hover:bg-elevated/50 transition-colors"
              >
                <td class="px-4 py-3 font-medium text-ink">{{ row.teamName }}</td>
                <td class="px-4 py-3 text-ink-muted">{{ row.sessionCount }}</td>
                <td class="px-4 py-3 text-ink-muted">{{ row.feedbackCount }}</td>
                <td class="px-4 py-3 text-ink-muted">{{ row.participantCount }}</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="4" class="px-4 py-6 text-center text-ink-muted text-xs">데이터 없음</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Quick links -->
      <div class="grid grid-cols-2 gap-4">
        <NuxtLink to="/admin/teams" class="card-hover p-5 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center text-xl">🏢</div>
          <div>
            <p class="font-semibold text-ink">팀 관리</p>
            <p class="text-xs text-ink-muted">팀 생성, 팀원 관리, 초대 코드</p>
          </div>
        </NuxtLink>
        <NuxtLink to="/admin/users" class="card-hover p-5 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center text-xl">👤</div>
          <div>
            <p class="font-semibold text-ink">사용자 관리</p>
            <p class="text-xs text-ink-muted">역할 변경, 계정 활성화</p>
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

const { data: stats, pending } = await useFetch<{
  teamCount: number
  userCount: number
  sessionCount: number
  feedbackCount: number
  teamStats: { teamId: string; teamName: string; sessionCount: number; feedbackCount: number; participantCount: number }[]
}>('/api/admin/stats')

const sortedTeamStats = computed(() => {
  if (!stats.value?.teamStats) return []
  return [...stats.value.teamStats].sort((a, b) => b.feedbackCount - a.feedbackCount)
})
</script>
