<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative z-10 card max-w-lg w-full p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-display font-bold text-ink">AI 문체 변환 미리보기</h3>
          <button class="btn-ghost text-xs p-1" @click="$emit('close')">✕</button>
        </div>

        <div class="space-y-4">
          <!-- Original -->
          <div>
            <p class="section-label mb-2">📝 원본</p>
            <div class="bg-elevated rounded-lg p-3 text-sm text-ink leading-relaxed border border-border">
              {{ original }}
            </div>
          </div>

          <!-- Arrow -->
          <div class="text-center text-ink-muted text-xs">▼ AI 변환</div>

          <!-- Transformed -->
          <div>
            <p class="section-label mb-2">🤖 변환 결과</p>
            <div v-if="loading" class="bg-elevated rounded-lg p-3 flex items-center justify-center h-20">
              <LoadingSpinner size="sm" label="변환 중..." />
            </div>
            <div v-else-if="transformed" class="bg-elevated rounded-lg p-3 text-sm text-ink leading-relaxed border border-accent/30">
              {{ transformed }}
            </div>
            <div v-else-if="error" class="bg-danger/10 rounded-lg p-3 text-sm text-danger border border-danger/20">
              {{ error }}
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-ghost flex-1 text-sm" @click="$emit('close')">취소</button>
          <button class="btn-secondary text-sm" :disabled="loading" @click="retry">🔄 재변환</button>
          <button
            class="btn-primary flex-1 text-sm"
            :disabled="loading || (!transformed && !error)"
            @click="submit"
          >
            {{ error ? '원문으로 제출' : '제출' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  original: string
  sessionId: string
  category: string
}>()

const emit = defineEmits(['close', 'submitted'])
const toast = useToast()

const transformed = ref('')
const loading = ref(true)
const error = ref('')

async function transform() {
  loading.value = true
  error.value = ''
  transformed.value = ''
  try {
    const data = await $fetch<{ transformed: string }>('/api/feedbacks/transform', {
      method: 'POST',
      body: { content: props.original }
    })
    transformed.value = data.transformed
  } catch {
    error.value = '문체 변환에 실패했습니다. 원문으로 제출하시겠습니까?'
  } finally {
    loading.value = false
  }
}

async function submit() {
  const content = error.value ? props.original : transformed.value
  try {
    await $fetch('/api/feedbacks', {
      method: 'POST',
      body: { sessionId: props.sessionId, category: props.category, content }
    })
    toast.success('피드백이 제출되었습니다')
    emit('submitted')
  } catch {
    toast.error('피드백 제출에 실패했습니다')
  }
}

function retry() { transform() }

onMounted(() => transform())
</script>
