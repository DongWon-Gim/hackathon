<template>
  <div layout="auth">
    <div class="card p-6">
      <h1 class="font-display text-xl font-bold text-ink mb-1">로그인</h1>
      <p class="text-xs text-ink-muted mb-6">팀 회고를 시작하세요</p>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="input-label">이메일</label>
          <input v-model="form.email" type="email" class="input" placeholder="you@company.com" required />
        </div>
        <div>
          <label class="input-label">비밀번호</label>
          <input v-model="form.password" type="password" class="input" placeholder="••••••••" required />
        </div>

        <div v-if="errorMsg" class="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <p class="text-center text-xs text-ink-muted mt-6">
        계정이 없으신가요?
        <NuxtLink to="/register" class="text-accent hover:underline">회원가입</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await login(form.email, form.password)
  } catch (e: unknown) {
    const err = e as { data?: { data?: { message?: string } } }
    errorMsg.value = err?.data?.data?.message || '로그인에 실패했습니다'
  } finally {
    loading.value = false
  }
}
</script>
