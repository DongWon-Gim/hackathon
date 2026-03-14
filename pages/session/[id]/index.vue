<template>
  <div class="px-6 py-8 max-w-2xl">
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
        <button
          v-if="isLeader && session.status === 'ACTIVE'"
          class="btn-danger text-xs"
          @click="showCloseDialog = true"
        >
          세션 마감
        </button>
      </div>

      <!-- Closed notice -->
      <div v-if="session.status === 'CLOSED'" class="card p-4 mb-6 border-ink-subtle/30">
        <p class="text-sm text-ink-muted text-center">이 세션은 마감되었습니다</p>
      </div>

      <!-- Feedback form -->
      <template v-if="session.status === 'ACTIVE'">
        <!-- Category tabs -->
        <div class="flex gap-1 mb-4 p-1 bg-elevated rounded-xl">
          <button
            v-for="cat in categories"
            :key="cat.value"
            class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
            :class="activeCategory === cat.value ? `bg-surface text-ink shadow-card` : 'text-ink-muted hover:text-ink'"
            @click="activeCategory = cat.value"
          >
            <span class="mr-1.5">{{ cat.emoji }}</span>
            {{ cat.label }}
            <span class="ml-1.5 font-mono text-xs opacity-60">{{ counts[cat.value] ?? 0 }}</span>
          </button>
        </div>

        <div class="card p-4">
          <label class="input-label mb-2 block">
            {{ activeCategory === 'KEEP' ? '잘 되었던 점' : activeCategory === 'PROBLEM' ? '개선이 필요한 점' : '시도해볼 것' }}
          </label>
          <textarea
            v-model="content"
            class="input resize-none h-28"
            :placeholder="placeholder"
            maxlength="500"
          />
          <div class="flex items-center justify-between mt-3">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <div
                class="relative w-9 h-5 rounded-full transition-colors"
                :class="aiTransform ? 'bg-accent' : 'bg-elevated border border-border'"
                @click="aiTransform = !aiTransform"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  :class="aiTransform ? 'translate-x-4' : 'translate-x-0.5'"
                />
              </div>
              <span class="text-xs text-ink-muted">AI 문체 변환</span>
            </label>
            <button class="btn-primary text-sm" :disabled="!content.trim() || submitting" @click="handleSubmit">
              <LoadingSpinner v-if="submitting" size="sm" />
              {{ submitting ? '제출 중...' : '제출' }}
            </button>
          </div>
        </div>

        <!-- Anonymity notice -->
        <p class="text-xs text-ink-subtle text-center mt-4">
          🔒 피드백은 익명으로 처리되며 제출 후 수정/삭제할 수 없습니다
        </p>
      </template>

    </template>

    <!-- AI Transform Modal -->
    <AITransformModal
      v-if="showTransformModal"
      :original="content"
      :session-id="route.params.id as string"
      :category="activeCategory"
      :user-session-id="anonId"
      @close="showTransformModal = false"
      @submitted="onSubmitted"
    />

    <!-- Close Session Dialog -->
    <ConfirmDialog
      :is-open="showCloseDialog"
      title="세션 마감"
      message="세션을 마감하면 더 이상 피드백을 받지 않습니다. 계속하시겠습니까?"
      confirm-text="마감"
      variant="danger"
      @confirm="closeSession"
      @cancel="showCloseDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Session } from '~/types'
import { FEEDBACK_CATEGORIES } from '~/composables/useFeedbackCategories'

const route = useRoute()
const { isLeader } = useAuth()
const toast = useToast()

const { data: session, pending, refresh } = await useFetch<Session>(`/api/sessions/${route.params.id}`)
const { data: stats, refresh: refreshStats } = await useFetch<Record<string, number>>(`/api/sessions/${route.params.id}/stats`, { lazy: true })

// 5초 폴링 — 피드백 카운트 실시간 반영
let pollTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  pollTimer = setInterval(() => {
    if (session.value?.status === 'ACTIVE') refreshStats()
  }, 5000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// 브라우저 익명 식별자 — 로그인과 무관, 참여자 수 집계용
const anonId = useCookie('_rl_anon', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax'
})
if (!anonId.value) {
  anonId.value = crypto.randomUUID()
}

const activeCategory = ref<'KEEP' | 'PROBLEM' | 'TRY'>('KEEP')
const content = ref('')
const aiTransform = ref(false)
const submitting = ref(false)
const showTransformModal = ref(false)
const showCloseDialog = ref(false)

const counts = computed(() => stats.value || {})

const categories = FEEDBACK_CATEGORIES

const placeholder = computed(() => ({
  KEEP: '잘 되었던 점을 자유롭게 적어주세요',
  PROBLEM: '개선이 필요한 점을 적어주세요',
  TRY: '다음에 시도해볼 것을 적어주세요'
}[activeCategory.value]))

async function handleSubmit() {
  if (!content.value.trim()) return
  if (aiTransform.value) {
    showTransformModal.value = true
    return
  }
  await submitFeedback(content.value)
}

async function submitFeedback(text: string) {
  submitting.value = true
  try {
    await $fetch(`/api/sessions/${route.params.id}/feedbacks`, {
      method: 'POST',
      body: { category: activeCategory.value, content: text, userSessionId: anonId.value }
    })
    content.value = ''
    toast.success('피드백이 제출되었습니다')
    await refreshStats()
  } catch {
    toast.error('피드백 제출에 실패했습니다')
  } finally {
    submitting.value = false
  }
}

function onSubmitted() {
  showTransformModal.value = false
  content.value = ''
  refreshStats()
}

async function closeSession() {
  showCloseDialog.value = false
  try {
    await $fetch(`/api/sessions/${route.params.id}/close`, { method: 'PATCH' })
    toast.success('세션이 마감되었습니다')
    await refresh()
  } catch {
    toast.error('세션 마감에 실패했습니다')
  }
}
</script>
