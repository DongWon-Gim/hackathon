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

      <!-- Empty feedback state -->
      <div v-if="!hasFeedbacks" data-testid="empty-feedback-state" class="text-center py-10 text-sm text-ink-muted mb-8">
        아직 피드백이 없습니다
      </div>

      <!-- Feedback columns -->
      <div v-if="hasFeedbacks" data-testid="feedback-list" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div v-for="cat in categories" :key="cat.value" :data-testid="`${cat.value.toLowerCase()}-section`">
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
                  :class="session.status === 'CLOSED'
                    ? 'text-ink-subtle cursor-default'
                    : fb.hasVoted ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink hover:bg-elevated'"
                  :disabled="votingInProgress.has(fb.id) || session.status === 'CLOSED'"
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
              v-if="isLeader && insight"
              data-testid="delete-insight-button"
              class="text-xs px-2 py-1 rounded-md border border-danger/30 text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors"
              :disabled="deletingInsight"
              @click="deleteInsight"
              title="인사이트 삭제 (테스트용)"
            >
              <LoadingSpinner v-if="deletingInsight" size="sm" />
              <span v-else>🗑</span>
            </button>
            <button
              v-if="isLeader && !insight && session.status === 'CLOSED'"
              data-testid="generate-insight-button"
              class="btn-primary text-xs"
              :disabled="generatingInsight || !hasFeedbacks"
              @click="generateInsight"
            >
              <LoadingSpinner v-if="generatingInsight" size="sm" />
              {{ generatingInsight ? '분석 중...' : '🤖 인사이트 생성' }}
            </button>
          </div>
        </div>

        <div v-if="generatingInsight" data-testid="insight-loading" class="text-center py-8 text-sm text-ink-muted">
          AI가 피드백을 분석하고 있습니다...
        </div>

        <EmptyState
          v-else-if="!insight"
          :message="hasFeedbacks ? '인사이트를 생성해보세요' : '피드백이 없어 인사이트를 생성할 수 없습니다'"
          icon="🤖"
        />

        <template v-else>
          <p data-testid="insight-summary" class="text-sm text-ink leading-relaxed mb-4 pb-4 border-b border-border">{{ insight.summary }}</p>
          <div data-testid="insight-issues" class="space-y-3">
            <div
              v-for="(issue, i) in insight.issues"
              :key="i"
              class="p-3 bg-elevated rounded-lg border-l-2 border-accent"
            >
              <p class="text-sm font-semibold text-ink mb-1">{{ issue.title }}</p>
              <p class="text-xs text-ink-muted mb-2">{{ issue.description }}</p>
              <p class="text-xs text-accent">→ {{ issue.action }}</p>
              <div v-if="isLeader" class="mt-2">
                <button
                  v-if="!usedIssueIndices.has(i)"
                  class="text-xs px-2 py-1 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  @click="openIssueAction(issue.action, i)"
                >
                  + 액션 아이템 추가
                </button>
                <span v-else class="text-xs text-ink-muted">✓ 전환됨</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Action Items -->
      <div class="card p-5 mt-6">
        <div class="flex items-center justify-between mb-4">
          <p class="section-label">액션 아이템</p>
          <button
            v-if="isLeader"
            class="btn-primary text-xs"
            @click="prefillIssueIndex = null; showActionModal = true"
          >
            +
          </button>
        </div>

        <EmptyState
          v-if="!actions?.length"
          message="액션 아이템이 없습니다"
          icon="✅"
        />

        <div v-else class="space-y-2">
          <div
            v-for="action in actions"
            :key="action.id"
            class="flex items-start gap-3 p-3 bg-elevated rounded-lg border border-border transition-opacity"
            :class="action.status === 'COMPLETED' ? 'opacity-60' : ''"
          >
            <input
              type="checkbox"
              :checked="action.status === 'COMPLETED'"
              class="mt-0.5 accent-accent cursor-pointer"
              :disabled="togglingAction.has(action.id)"
              @change="toggleAction(action)"
            />
            <div class="flex-1 min-w-0">
              <p
                class="text-sm text-ink leading-relaxed"
                :class="action.status === 'COMPLETED' ? 'line-through text-ink-muted' : ''"
              >
                {{ action.content }}
              </p>
              <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                <p v-if="action.assigneeName" class="text-xs text-ink-muted">
                  👤 {{ action.assigneeName }}
                </p>
                <p v-if="action.dueDate" class="text-xs text-ink-muted">
                  📅 {{ new Date(action.dueDate).toLocaleDateString('ko-KR') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Comparison -->
      <div class="mt-6">
        <button
          class="btn-ghost text-xs mb-3"
          @click="showHistory = !showHistory"
        >
          {{ showHistory ? '▲ 히스토리 비교 닫기' : '▼ 히스토리 비교' }}
        </button>

        <div v-if="showHistory" class="card p-5">
          <p class="section-label mb-4">히스토리 비교</p>

          <div v-if="historyPending" class="text-center py-8 text-sm text-ink-muted">
            히스토리를 불러오는 중...
          </div>

          <template v-else-if="history">
            <div
              v-if="history.sessions.length <= 1"
              class="text-sm text-ink-muted text-center py-6"
            >
              비교할 세션이 부족합니다
            </div>

            <template v-else>
              <!-- Repeated issues warning banner -->
              <div
                v-if="history.repeatedTitles?.length"
                class="flex items-center gap-2 mb-4 px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger"
              >
                ⚠️ {{ history.repeatedTitles.length }}개 반복 이슈 발견
              </div>

              <!-- Sessions grid -->
              <div
                class="grid gap-4 overflow-x-auto pb-2"
                :style="{ gridTemplateColumns: `repeat(${Math.min(history.sessions.length, 5)}, minmax(180px, 1fr))` }"
              >
                <div
                  v-for="s in history.sessions.slice(0, 5)"
                  :key="s.id"
                  class="bg-elevated rounded-lg border border-border p-3 min-w-0"
                >
                  <p class="text-xs font-semibold text-ink truncate mb-0.5">{{ s.title }}</p>
                  <p class="text-xs text-ink-muted mb-3">
                    {{ new Date(s.createdAt).toLocaleDateString('ko-KR') }}
                  </p>
                  <div class="space-y-2">
                    <div
                      v-for="(issue, i) in s.issues"
                      :key="i"
                      class="p-2 bg-base rounded border-l-2 text-xs leading-snug"
                      :class="history.repeatedTitles?.includes(issue.title)
                        ? 'border-danger text-danger'
                        : 'border-accent text-ink'"
                    >
                      <p class="font-medium mb-0.5">{{ issue.title }}</p>
                      <p class="text-ink-muted text-[11px]">{{ issue.description }}</p>
                      <p
                        class="mt-1 text-[11px]"
                        :class="history.repeatedTitles?.includes(issue.title) ? 'text-danger' : 'text-accent'"
                      >
                        → {{ issue.action }}
                      </p>
                    </div>
                    <p v-if="!s.issues?.length" class="text-xs text-ink-muted">이슈 없음</p>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </template>
  </div>

  <!-- 액션 아이템 추가 모달 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showActionModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" @click="cancelActionForm" />
        <div class="relative z-10 card max-w-md w-full p-6">
          <h3 class="font-display font-bold text-ink mb-4">액션 아이템 추가</h3>
          <div class="space-y-3">
            <textarea
              v-model="newActionContent"
              class="input w-full text-sm resize-none"
              rows="3"
              placeholder="액션 아이템 내용을 입력하세요"
            />
            <select v-model="newActionAssigneeId" class="input w-full text-sm">
              <option value="">담당자 없음</option>
              <option v-for="m in teamMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
            <DateInput v-model="newActionDueDate" input-class="w-full text-sm" />
          </div>
          <div class="flex gap-2 justify-end mt-4">
            <button class="btn-ghost text-sm" @click="cancelActionForm">취소</button>
            <button
              class="btn-primary text-sm"
              :disabled="!newActionContent.trim() || savingAction"
              @click="addAction"
            >
              <LoadingSpinner v-if="savingAction" size="sm" />
              {{ savingAction ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

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
import type { Session, Feedback, Insight, ActionItem } from '~/types'
import { FEEDBACK_CATEGORIES } from '~/composables/useFeedbackCategories'

interface HistoryIssue {
  title: string
  description: string
  action: string
}

interface HistorySession {
  id: string
  title: string
  createdAt: string
  status: string
  issues: HistoryIssue[]
}

interface SessionHistory {
  sessions: HistorySession[]
  repeatedTitles: string[]
}

const route = useRoute()
const { isLeader } = useAuth()
const toast = useToast()

const { data: session, pending } = await useFetch<Session>(`/api/sessions/${route.params.id}`)
const { data: stats } = await useFetch<Record<string, number>>(`/api/sessions/${route.params.id}/stats`)
const { data: feedbacks, refresh: refreshFeedbacks } = await useFetch<Feedback[]>(`/api/sessions/${route.params.id}/feedbacks`)
const { data: insight, refresh: refreshInsight } = await useFetch<Insight | null>(`/api/sessions/${route.params.id}/insights`)

const generatingInsight = ref(false)
const togglingShare = ref(false)
const deletingInsight = ref(false)
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

const categories = FEEDBACK_CATEGORIES

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
    } else {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

async function deleteInsight() {
  if (!confirm('인사이트를 삭제하시겠습니까?')) return
  deletingInsight.value = true
  try {
    await $fetch(`/api/sessions/${route.params.id}/insights`, { method: 'DELETE' })
    await refreshInsight()
    toast.success('인사이트가 삭제되었습니다')
  } catch {
    toast.error('삭제에 실패했습니다')
  } finally {
    deletingInsight.value = false
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

// ── Action Items (TASK-033) ──────────────────────────────────────────────────
const { data: actions, refresh: refreshActions } = await useFetch<ActionItem[]>(
  `/api/sessions/${route.params.id}/actions`,
  { lazy: true }
)

const { data: teamMembers } = await useFetch<{ id: string; name: string; role: string }[]>(
  '/api/teams/members',
  { lazy: true, default: () => [] }
)

const showActionModal = ref(false)
const prefillIssueIndex = ref<number | null>(null)
const newActionContent = ref('')
const newActionAssigneeId = ref('')
const newActionDueDate = ref('')
const savingAction = ref(false)
const togglingAction = ref(new Set<string>())

const usedIssueIndices = computed(() =>
  new Set(actions.value?.filter(a => a.issueIndex !== null).map(a => a.issueIndex as number))
)

function openIssueAction(actionText: string, index: number) {
  newActionContent.value = actionText
  prefillIssueIndex.value = index
  showActionModal.value = true
}

function cancelActionForm() {
  showActionModal.value = false
  prefillIssueIndex.value = null
  newActionContent.value = ''
  newActionAssigneeId.value = ''
  newActionDueDate.value = ''
}

async function addAction() {
  if (!newActionContent.value.trim()) return
  savingAction.value = true
  try {
    await $fetch(`/api/sessions/${route.params.id}/actions`, {
      method: 'POST',
      body: {
        content: newActionContent.value.trim(),
        ...(newActionAssigneeId.value ? { assigneeId: newActionAssigneeId.value } : {}),
        ...(newActionDueDate.value ? { dueDate: newActionDueDate.value } : {}),
        ...(prefillIssueIndex.value !== null ? { issueIndex: prefillIssueIndex.value } : {})
      }
    })
    await refreshActions()
    cancelActionForm()
    toast.success('액션 아이템이 추가되었습니다')
  } catch {
    toast.error('액션 아이템 추가에 실패했습니다')
  } finally {
    savingAction.value = false
  }
}

async function toggleAction(action: ActionItem) {
  togglingAction.value = new Set(togglingAction.value).add(action.id)
  const nextStatus = action.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
  try {
    await $fetch(`/api/actions/${action.id}`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    await refreshActions()
  } catch {
    toast.error('상태 변경에 실패했습니다')
  } finally {
    const next = new Set(togglingAction.value)
    next.delete(action.id)
    togglingAction.value = next
  }
}

// ── History Comparison (TASK-035) ────────────────────────────────────────────
const showHistory = ref(false)

const { data: history, pending: historyPending, execute: fetchHistory } = await useFetch<SessionHistory>(
  `/api/sessions/${route.params.id}/history`,
  { lazy: true, immediate: false }
)

watch(showHistory, (val) => {
  if (val && !history.value) fetchHistory()
})
</script>


<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
