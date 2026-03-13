<template>
  <div>
    <div class="card p-6">
      <h1 class="font-display text-xl font-bold text-ink mb-1">팀 합류</h1>
      <p class="text-xs text-ink-muted mb-6">팀장에게 받은 초대 코드를 입력하세요</p>

      <form class="space-y-4" @submit.prevent="handleJoin">
        <div>
          <label class="input-label">팀 초대 코드</label>
          <input
            v-model="inviteCode"
            type="text"
            class="input font-mono tracking-widest uppercase"
            placeholder="XXXX-XXXX-XXXX"
            required
          />
        </div>

        <div v-if="errorMsg" class="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? '합류 중...' : '팀 합류' }}
        </button>
      </form>

      <div class="divider my-4" />
      <button class="btn-ghost w-full text-xs" @click="logout">로그아웃</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { joinTeam, logout } = useAuth()
const inviteCode = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleJoin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await joinTeam(inviteCode.value.trim())
  } catch (e: unknown) {
    const err = e as { data?: { data?: { message?: string } } }
    errorMsg.value = err?.data?.data?.message || '팀 합류에 실패했습니다'
  } finally {
    loading.value = false
  }
}
</script>
