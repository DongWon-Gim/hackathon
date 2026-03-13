<template>
  <div>
    <div class="card p-6">
      <h1 class="font-display text-xl font-bold text-ink mb-1">회원가입</h1>
      <p class="text-xs text-ink-muted mb-6">새 계정을 만들어 팀 회고를 시작하세요</p>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="input-label">이름</label>
          <input v-model="form.name" type="text" class="input" placeholder="홍길동" required />
        </div>
        <div>
          <label class="input-label">이메일</label>
          <input v-model="form.email" type="email" class="input" placeholder="you@company.com" required />
        </div>
        <div>
          <label class="input-label">비밀번호</label>
          <input v-model="form.password" type="password" class="input" placeholder="최소 8자, 영문+숫자" required />
          <div class="flex gap-3 mt-2">
            <span class="text-xs" :class="pw8.ok ? 'text-success' : 'text-ink-subtle'">
              {{ pw8.ok ? '✓' : '○' }} 8자 이상
            </span>
            <span class="text-xs" :class="pwAlnum.ok ? 'text-success' : 'text-ink-subtle'">
              {{ pwAlnum.ok ? '✓' : '○' }} 영문+숫자
            </span>
          </div>
        </div>
        <div>
          <label class="input-label">비밀번호 확인</label>
          <input v-model="form.confirm" type="password" class="input" placeholder="비밀번호 재입력" required />
          <p v-if="form.confirm && !pwMatch" class="text-xs text-danger mt-1">비밀번호가 일치하지 않습니다</p>
        </div>

        <div v-if="errorMsg" class="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading || !canSubmit">
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <p class="text-center text-xs text-ink-muted mt-6">
        이미 계정이 있으신가요?
        <NuxtLink to="/login" class="text-accent hover:underline">로그인</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { register } = useAuth()
const form = reactive({ name: '', email: '', password: '', confirm: '' })
const loading = ref(false)
const errorMsg = ref('')

const pw8 = computed(() => ({ ok: form.password.length >= 8 }))
const pwAlnum = computed(() => ({ ok: /(?=.*[a-zA-Z])(?=.*\d)/.test(form.password) }))
const pwMatch = computed(() => form.password === form.confirm)
const canSubmit = computed(() => pw8.value.ok && pwAlnum.value.ok && pwMatch.value)

async function handleRegister() {
  if (!canSubmit.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await register(form.name, form.email, form.password)
  } catch (e: unknown) {
    const err = e as { data?: { data?: { message?: string } } }
    errorMsg.value = err?.data?.data?.message || '회원가입에 실패했습니다'
  } finally {
    loading.value = false
  }
}
</script>
