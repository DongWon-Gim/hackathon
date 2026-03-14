<template>
  <div class="page-container max-w-xl">
    <div class="mb-6">
<h1 class="page-title">새 회고 세션</h1>
    </div>

    <div class="card p-6">
      <form class="space-y-5" @submit.prevent="handleCreate">
        <div>
          <label class="input-label">세션 제목 *</label>
          <input v-model="form.title" type="text" class="input" placeholder="예: Sprint 12 회고" required />
        </div>
        <div>
          <label class="input-label">프로젝트명 *</label>
          <input v-model="form.projectName" type="text" class="input" placeholder="예: RetroLens" required />
        </div>
        <div>
          <label class="input-label">회고 기간 (선택)</label>
          <div class="flex items-center gap-3">
            <DateInput v-model="form.periodStart" />
            <span class="text-ink-muted text-sm flex-shrink-0">~</span>
            <DateInput v-model="form.periodEnd" />
          </div>
        </div>

        <div v-if="errorMsg" class="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>

        <div class="flex gap-3 pt-2">
          <NuxtLink to="/" class="btn-secondary flex-1 text-center">취소</NuxtLink>
          <button type="submit" class="btn-primary flex-1" :disabled="loading">
            <LoadingSpinner v-if="loading" size="sm" />
            {{ loading ? '생성 중...' : '세션 생성' }}
          </button>
        </div>
      </form>

      <!-- 생성 완료 -->
      <div v-if="createdUrl" class="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
        <p class="text-xs text-success font-medium mb-2">✓ 세션이 생성되었습니다!</p>
        <p class="text-xs text-ink-muted mb-2">팀원에게 아래 URL을 공유하세요</p>
        <div class="flex items-center gap-2">
          <code class="flex-1 text-xs font-mono bg-elevated rounded px-2 py-1.5 text-ink truncate">{{ createdUrl }}</code>
          <button class="btn-secondary text-xs px-3" @click="copyUrl">{{ copied ? '✓' : '복사' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'leader-only' })

const router = useRouter()
const form = reactive({ title: '', projectName: '', periodStart: '', periodEnd: '' })
const loading = ref(false)
const errorMsg = ref('')
const createdUrl = ref('')
const copied = ref(false)

async function handleCreate() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<{ session: { id: string } }>('/api/sessions', {
      method: 'POST',
      body: form
    })
    createdUrl.value = `${window.location.origin}/session/${data.session.id}`
    setTimeout(() => router.push(`/session/${data.session.id}`), 3000)
  } catch (e: unknown) {
    const err = e as { data?: { data?: { message?: string } } }
    errorMsg.value = err?.data?.data?.message || '세션 생성에 실패했습니다'
  } finally {
    loading.value = false
  }
}

async function copyUrl() {
  await navigator.clipboard.writeText(createdUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
