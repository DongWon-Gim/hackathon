<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div>
        <NuxtLink to="/admin" class="text-xs text-ink-muted hover:text-ink mb-2 inline-block">← 관리자 홈</NuxtLink>
        <h1 class="page-title">사용자 관리</h1>
      </div>
      <input v-model="search" type="text" class="input w-64 text-sm" placeholder="이름/이메일 검색" />
    </div>

    <LoadingSpinner v-if="pending" full-page />

    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">이름</th>
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">이메일</th>
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">팀</th>
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">역할</th>
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">상태</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in filteredUsers"
            :key="u.id"
            class="border-b border-border/50 hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-ink">{{ u.name }}</td>
            <td class="px-4 py-3 text-ink-muted text-xs font-mono">{{ u.email }}</td>
            <td class="px-4 py-3 text-ink-muted">{{ u.teamName || '—' }}</td>
            <td class="px-4 py-3">
              <select
                :value="u.role"
                class="bg-elevated border border-border rounded text-xs text-ink px-2 py-1"
                @change="changeRole(u.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="LEADER">LEADER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <button
                class="text-xs px-2 py-0.5 rounded-full border transition-colors"
                :class="u.isActive ? 'border-success/30 text-success bg-success/10' : 'border-border text-ink-muted'"
                @click="toggleStatus(u.id, u.isActive)"
              >
                {{ u.isActive ? '활성' : '비활성' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

const toast = useToast()
const search = ref('')

const { data: usersData, pending, refresh } = await useFetch<{
  users: { id: string; name: string; email: string; role: string; teamName: string | null; isActive: boolean }[]
}>('/api/admin/users')

const filteredUsers = computed(() => {
  const list = usersData.value?.users ?? []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
})

async function changeRole(id: string, role: string) {
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'PUT', body: { role } })
    toast.success('역할이 변경되었습니다')
    await refresh()
  } catch {
    toast.error('역할 변경에 실패했습니다')
  }
}

async function toggleStatus(id: string, current: boolean) {
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'PUT', body: { isActive: !current } })
    toast.success(current ? '계정이 비활성화되었습니다' : '계정이 활성화되었습니다')
    await refresh()
  } catch {
    toast.error('상태 변경에 실패했습니다')
  }
}
</script>
