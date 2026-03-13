<template>
  <div class="px-6 py-8">
    <LoadingSpinner v-if="pending" full-page />
    <template v-else-if="session">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <Badge :label="session.status === 'ACTIVE' ? '진행중' : '마감'" :variant="session.status === 'ACTIVE' ? 'active' : 'closed'" />
          </div>
          <h1 class="page-title">{{ session.title }}</h1>
          <p class="text-sm text-ink-muted">{{ session.projectName }}</p>
        </div>
        <div v-if="isLeader && stats" class="text-right">
          <p class="text-2xl font-display font-bold text-accent">{{ stats.participants ?? 0 }}</p>
          <p class="text-xs text-ink-muted">참여자 수</p>
        </div>
      </div>

      <!-- Feedback columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div v-for="cat in categories" :key="cat.value">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-semibold" :class="cat.textColor">{{ cat.emoji }} {{ cat.label }}</span>
            <span class="font-mono text-xs text-ink-muted bg-elevated px-1.5 py-0.5 rounded">
              {{ feedbacksByCategory[cat.value]?.length ?? 0 }}
            </span>
          </div>

          <EmptyState
            v-if="!feedbacksByCategory[cat.value]?.length"
            :message="`${cat.label} 피드백 없음`"
            icon="·"
          />

          <div v-else class="space-y-2">
            <div
              v-for="fb in feedbacksByCategory[cat.value]"
              :key="fb.id"
              class="card p-3 text-sm text-ink leading-relaxed"
            >
              {{ fb.content }}
            </div>
          </div>
        </div>
      </div>

      <!-- AI Insight -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <p class="section-label">AI 인사이트</p>
          <button
            v-if="isLeader && !insight && session.status === 'CLOSED'"
            class="btn-primary text-xs"
            :disabled="generatingInsight || !hasFeedbacks"
            @click="generateInsight"
          >
            <LoadingSpinner v-if="generatingInsight" size="sm" />
            {{ generatingInsight ? '분석 중...' : '🤖 인사이트 생성' }}
          </button>
        </div>

        <div v-if="generatingInsight" class="text-center py-8 text-sm text-ink-muted">
          AI가 피드백을 분석하고 있습니다...
        </div>

        <EmptyState
          v-else-if="!insight"
          :message="hasFeedbacks ? '인사이트를 생성해보세요' : '피드백이 없어 인사이트를 생성할 수 없습니다'"
          icon="🤖"
        />

        <template v-else>
          <p class="text-sm text-ink leading-relaxed mb-4 pb-4 border-b border-border">{{ insight.summary }}</p>
          <div class="space-y-3">
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
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Session, Feedback, Insight } from '~/types'

const route = useRoute()
const { isLeader } = useAuth()
const toast = useToast()

const { data: session, pending } = await useFetch<Session>(`/api/sessions/${route.params.id}`)
const { data: stats } = await useFetch<Record<string, number>>(`/api/sessions/${route.params.id}/stats`)
const { data: feedbacks, refresh: refreshFeedbacks } = await useFetch<Feedback[]>(`/api/sessions/${route.params.id}/feedbacks`)
const { data: insight, refresh: refreshInsight } = await useFetch<Insight | null>(`/api/sessions/${route.params.id}/insights`)

const generatingInsight = ref(false)

const categories = [
  { value: 'KEEP' as const, label: 'Keep', emoji: '✅', textColor: 'text-keep' },
  { value: 'PROBLEM' as const, label: 'Problem', emoji: '🔴', textColor: 'text-problem' },
  { value: 'TRY' as const, label: 'Try', emoji: '💡', textColor: 'text-try' }
]

const feedbacksByCategory = computed(() => {
  const result: Record<string, Feedback[]> = { KEEP: [], PROBLEM: [], TRY: [] }
  feedbacks.value?.forEach((f) => result[f.category]?.push(f))
  return result
})

const hasFeedbacks = computed(() => (feedbacks.value?.length ?? 0) > 0)

async function generateInsight() {
  generatingInsight.value = true
  try {
    await $fetch(`/api/sessions/${route.params.id}/insights`, {
      method: 'POST'
    })
    await refreshInsight()
    toast.success('인사이트가 생성되었습니다')
  } catch {
    toast.error('인사이트 생성에 실패했습니다')
  } finally {
    generatingInsight.value = false
  }
}
</script>
