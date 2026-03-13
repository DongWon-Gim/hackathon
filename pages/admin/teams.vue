<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div>
        <NuxtLink to="/admin" class="text-xs text-ink-muted hover:text-ink mb-2 inline-block">← 관리자 홈</NuxtLink>
        <h1 class="page-title">팀 관리</h1>
      </div>
      <button class="btn-primary text-sm" @click="showCreateForm = true">+ 팀 생성</button>
    </div>

    <LoadingSpinner v-if="pending" full-page />

    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">팀명</th>
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">팀원</th>
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">세션</th>
            <th class="text-left px-4 py-3 text-xs text-ink-muted font-medium uppercase tracking-wide">초대 코드</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="team in teams"
            :key="team.id"
            class="border-b border-border/50 hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-ink">{{ team.name }}</td>
            <td class="px-4 py-3 text-ink-muted">{{ team.memberCount }}명</td>
            <td class="px-4 py-3 text-ink-muted">{{ team.sessionCount }}</td>
            <td class="px-4 py-3">
              <code class="text-xs font-mono text-ink-muted bg-elevated px-2 py-0.5 rounded">{{ team.inviteCode }}</code>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="btn-ghost text-xs mr-1" @click="deleteTeam(team.id)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create form modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreateForm" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" @click="showCreateForm = false" />
          <div class="relative z-10 card max-w-sm w-full p-6">
            <h3 class="font-display font-bold text-ink mb-4">팀 생성</h3>
            <label class="input-label">팀명</label>
            <input v-model="newTeamName" type="text" class="input mb-4" placeholder="예: 개발1팀" />
            <div class="flex gap-3">
              <button class="btn-ghost flex-1" @click="showCreateForm = false">취소</button>
              <button class="btn-primary flex-1" @click="createTeam">생성</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

const toast = useToast()
const showCreateForm = ref(false)
const newTeamName = ref('')

const { data: teams, pending, refresh } = await useFetch<{
  id: string; name: string; inviteCode: string; memberCount: number; sessionCount: number
}[]>('/api/teams')

async function createTeam() {
  if (!newTeamName.value.trim()) return
  try {
    await $fetch('/api/teams', { method: 'POST', body: { name: newTeamName.value } })
    toast.success('팀이 생성되었습니다')
    newTeamName.value = ''
    showCreateForm.value = false
    await refresh()
  } catch {
    toast.error('팀 생성에 실패했습니다')
  }
}

async function deleteTeam(id: string) {
  if (!confirm('팀을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/teams/${id}`, { method: 'POST' })
    toast.success('팀이 삭제되었습니다')
    await refresh()
  } catch {
    toast.error('팀 삭제에 실패했습니다')
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
