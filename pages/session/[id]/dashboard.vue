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

      <!-- Sort controls -->
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs text-ink-muted">정렬:</span>
        <button
          class="text-xs px-2.5 py-1 rounded-md transition-colors"
          :class="sortBy === 'votes' ? 'bg-accent text-white' : 'bg-elevated text-ink-muted hover:text-ink'"
          @click="sortBy = 'votes'"
        >
          투표순
        </button>
        <button
          class="text-xs px-2.5 py-1 rounded-md transition-colors"
          :class="sortBy === 'latest' ? 'bg-accent text-white' : 'bg-elevated text-ink-muted hover:text-ink'"
          @click="sortBy = 'latest'"
        >
          최신순
        </button>
      </div>

      <!-- Feedback columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div v-for="cat in categories" :key="cat.value">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-semibold" :class="cat.textColor">{{ cat.emoji }} {{ cat.label }}</span>
            <span class="font-mono text-xs text-ink-muted bg-elevated px-1.5 py-0.5 rounded">
              {{ sortedFeedbacksByCategory[cat.value]?.length ?? 0 }}
            </span>
          </div>

          <EmptyState
            v-if="!sortedFeedbacksByCategory[cat.value]?.length"
            :message="`${cat.label} 피드백 없음`"
            icon="·"
          />

          <div v-else class="space-y-2">
            <div
              v-for="fb in sortedFeedbacksByCategory[cat.value]"
              :key="fb.id"
              class="card p-3 text-sm text-ink leading-relaxed"
            >
              <p class="mb-2">{{ fb.content }}</p>
              <div class="flex items-center justify-end">
                <button
                  class="flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-md"
                  :class="fb.hasVoted ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink hover:bg-elevated'"
                  :disabled="votingInProgress.has(fb.id)"
                  @click="toggleVote(fb)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                  <span class="font-mono">{{ fb.voteCount }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Insight -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <p class="section-label">AI 인사이트</p>
          <div class="flex items-center gap-2">
            <button
              v-if="isLeader && insight"
              class="text-xs px-2.5 py-1 rounded-md border transition-colors"
              :class="insight.isShared ? 'border-accent text-accent bg-accent/10 hover:bg-accent/20' : 'border-border text-ink-muted hover:text-ink hover:border-ink-muted'"
              :disabled="togglingShare"
              @click="toggleShare"
            >
              {{ insight.isShared ? '🔓 공유 중' : '🔒 비공개' }}
            </button>
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

  <!-- AI 실패 시 임시 인사이트 선택 모달 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showFallbackModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" />
        <div class="relative z-10 card max-w-md w-full p-6">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl">⚠️</span>
            <div>
              <h3 class="font-display font-bold text-ink">AI 서비스 오류</h3>
              <p class="text-xs text-ink-muted mt-0.5">인사이트 생성 중 오류가 발생했습니다</p>
            </div>
          </div>

          <p class="text-sm text-ink-muted mb-5">
            피드백 내용을 기반으로 임시 인사이트를 생성할 수 있습니다.<br>
            나중에 다시 시도하면 AI 인사이트를 받을 수 있습니다.
          </p>

          <!-- 미리보기 -->
          <div v-if="fallbackPreview" class="bg-elevated rounded-lg p-3 mb-5 text-xs text-ink-muted border border-border">
            <p class="font-medium text-ink mb-1">임시 인사이트 미리보기</p>
            <p class="leading-relaxed">{{ fallbackPreview.summary }}</p>
          </div>

          <div class="flex gap-3">
            <button
              class="btn-ghost flex-1 text-sm"
              @click="showFallbackModal = false"
            >
              다시 시도
            </button>
            <button
              class="btn-primary flex-1 text-sm"
              :disabled="savingFallback"
              @click="saveFallback"
            >
              <LoadingSpinner v-if="savingFallback" size="sm" />
              {{ savingFallback ? '저장 중...' : '임시 데이터 사용' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
const togglingShare = ref(false)
const showFallbackModal = ref(false)
const savingFallback = ref(false)
const fallbackPreview = ref<{ summary: string; issues: { title: string; description: string; action: string }[] } | null>(null)
const sortBy = ref<'votes' | 'latest'>('latest')
const votingInProgress = ref(new Set<string>())

// 5초 폴링 — ACTIVE 세션만, 투표 진행 중 항목 없을 때만 갱신
let pollTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  pollTimer = setInterval(() => {
    if (session.value?.status === 'ACTIVE' && votingInProgress.value.size === 0) refreshFeedbacks()
  }, 5000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

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

const sortedFeedbacksByCategory = computed(() => {
  const result: Record<string, Feedback[]> = {}
  for (const cat of ['KEEP', 'PROBLEM', 'TRY']) {
    const items = [...(feedbacksByCategory.value[cat] ?? [])]
    if (sortBy.value === 'votes') {
      items.sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
    }
    result[cat] = items
  }
  return result
})

const hasFeedbacks = computed(() => (feedbacks.value?.length ?? 0) > 0)

async function toggleVote(fb: Feedback) {
  votingInProgress.value = new Set(votingInProgress.value).add(fb.id)
  try {
    if (fb.hasVoted) {
      await $fetch(`/api/feedbacks/${fb.id}/vote`, { method: 'DELETE' })
    } else {
      await $fetch(`/api/feedbacks/${fb.id}/vote`, { method: 'POST' })
    }
    await refreshFeedbacks()
  } catch {
    toast.error('투표 처리에 실패했습니다')
  } finally {
    const next = new Set(votingInProgress.value)
    next.delete(fb.id)
    votingInProgress.value = next
  }
}

async function toggleShare() {
  if (!insight.value) return
  togglingShare.value = true
  const nextShared = !insight.value.isShared
  try {
    await $fetch(`/api/insights/${insight.value.id}/share`, {
      method: 'PATCH',
      body: { isShared: nextShared }
    })
    await refreshInsight()
    toast.success(nextShared ? '인사이트를 공유했습니다' : '인사이트를 비공개로 변경했습니다')
  } catch {
    toast.error('공유 설정 변경에 실패했습니다')
  } finally {
    togglingShare.value = false
  }
}

async function generateInsight() {
  generatingInsight.value = true
  try {
    const res = await $fetch<{ isFallback?: boolean; preview?: typeof fallbackPreview.value } & Record<string, unknown>>(
      `/api/sessions/${route.params.id}/insights`,
      { method: 'POST' }
    )
    if (res.isFallback && res.preview) {
      fallbackPreview.value = res.preview
      showFallbackModal.value = true
    } else {
      await refreshInsight()
      toast.success('인사이트가 생성되었습니다')
    }
  } catch {
    toast.error('인사이트 생성에 실패했습니다')
  } finally {
    generatingInsight.value = false
  }
}

async function saveFallback() {
  savingFallback.value = true
  try {
    await $fetch(`/api/sessions/${route.params.id}/insights`, {
      method: 'POST',
      body: { useFallback: true }
    })
    await refreshInsight()
    showFallbackModal.value = false
    toast.success('임시 인사이트가 저장되었습니다')
  } catch {
    toast.error('저장에 실패했습니다')
  } finally {
    savingFallback.value = false
  }
}
</script>


<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
