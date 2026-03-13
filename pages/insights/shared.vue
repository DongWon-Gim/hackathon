<template>
  <div class="page-container">
    <div class="mb-8">
      <p class="section-label mb-1">팀 간 학습</p>
      <h1 class="page-title">공유된 인사이트</h1>
    </div>

    <LoadingSpinner v-if="pending" full-page />

    <EmptyState
      v-else-if="!insights?.length"
      icon="🌐"
      message="아직 공유된 인사이트가 없습니다"
      sub-message="팀장이 인사이트를 공유하면 여기에 표시됩니다"
    />

    <div v-else class="space-y-4">
      <div
        v-for="insight in insights"
        :key="insight.id"
        class="card cursor-pointer transition-all hover:border-accent/30"
        @click="toggle(insight.id)"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-ink-muted font-mono mb-1">{{ insight.session.teamName }} · {{ insight.session.title }}</p>
            <p class="text-sm text-ink leading-relaxed">{{ insight.summary }}</p>
          </div>
          <span class="text-ink-muted text-xs ml-4 flex-shrink-0 mt-0.5">
            {{ expanded.has(insight.id) ? '▲' : '▼' }}
          </span>
        </div>

        <div v-if="expanded.has(insight.id)" class="mt-4 pt-4 border-t border-border space-y-3">
          <div
            v-for="(issue, i) in insight.issues"
            :key="i"
            class="p-3 bg-elevated rounded-lg border-l-2 border-accent"
          >
            <p class="text-sm font-semibold text-ink mb-1">{{ issue.title }}</p>
            <p class="text-xs text-ink-muted mb-2">{{ issue.description }}</p>
            <p class="text-xs text-accent">→ {{ issue.action }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SharedInsight {
  id: string
  summary: string
  issues: { title: string; description: string; action: string }[]
  isShared: boolean
  sessionId: string
  createdAt: string
  session: {
    id: string
    title: string
    projectName: string
    teamName: string
    periodStart: string | null
    periodEnd: string | null
  }
}

const { data: insights, pending } = await useFetch<SharedInsight[]>('/api/insights/shared')
const expanded = ref(new Set<string>())

function toggle(id: string) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
  expanded.value = new Set(expanded.value) // trigger reactivity
}
</script>
