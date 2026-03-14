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
          <template v-for="team in teams" :key="team.id">
            <tr
              class="border-b border-border/50 hover:bg-elevated/50 transition-colors cursor-pointer"
              @click="toggleTeam(team.id)"
            >
              <td class="px-4 py-3 font-medium text-ink">
                <span class="mr-1 text-ink-muted text-xs">{{ expandedTeamId === team.id ? '▾' : '▸' }}</span>
                {{ team.name }}
              </td>
              <td class="px-4 py-3 text-ink-muted">{{ team.memberCount }}명</td>
              <td class="px-4 py-3 text-ink-muted">{{ team.sessionCount }}</td>
              <td class="px-4 py-3">
                <code class="text-xs font-mono text-ink-muted bg-elevated px-2 py-0.5 rounded">{{ team.inviteCode }}</code>
              </td>
              <td class="px-4 py-3 text-right">
                <button class="btn-ghost text-xs mr-1" @click.stop="deleteTeam(team.id)">삭제</button>
              </td>
            </tr>

            <!-- Member detail panel -->
            <tr v-if="expandedTeamId === team.id" :key="`panel-${team.id}`">
              <td colspan="5" class="bg-elevated/50 border-t border-border px-4 py-3">
                <LoadingSpinner v-if="membersLoading" />
                <div v-else>
                  <p class="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">팀원 목록</p>
                  <div v-if="teamMembers.length === 0" class="text-xs text-ink-muted py-2">팀원이 없습니다.</div>
                  <div
                    v-for="member in teamMembers"
                    :key="member.id"
                    class="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <div class="flex items-center gap-3">
                      <div>
                        <p class="text-sm text-ink font-medium">{{ member.name }}</p>
                        <p class="text-xs text-ink-muted">{{ member.email }}</p>
                      </div>
                      <span
                        class="text-xs px-2 py-0.5 rounded-full font-medium"
                        :class="roleBadgeClass(member.role)"
                      >{{ roleLabel(member.role) }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="member.role === 'MEMBER'"
                        class="btn-ghost text-xs"
                        @click="assignLeader(team.id, member.id)"
                      >팀장 지정</button>
                      <button
                        class="btn-ghost text-xs text-red-500 hover:text-red-600"
                        @click="removeMember(team.id, member.id)"
                      >제거</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
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
            <input v-model="newTeamName" type="text" class="input mb-3" placeholder="예: 개발1팀" @input="createError = ''" />
            <p v-if="createError" class="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-3">{{ createError }}</p>
            <div class="flex gap-3">
              <button class="btn-ghost flex-1" @click="showCreateForm = false; createError = ''">취소</button>
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
const createError = ref('')

const expandedTeamId = ref<string | null>(null)
const membersLoading = ref(false)
const teamMembers = ref<{ id: string; name: string; email: string; role: string }[]>([])

const { data: teamsData, pending, refresh } = await useFetch<{
  teams: { id: string; name: string; inviteCode: string; memberCount: number; sessionCount: number }[]
}>('/api/teams')

const teams = computed(() => teamsData.value?.teams ?? [])

async function toggleTeam(teamId: string) {
  if (expandedTeamId.value === teamId) {
    expandedTeamId.value = null
    teamMembers.value = []
    return
  }
  expandedTeamId.value = teamId
  await loadTeamMembers(teamId)
}

async function loadTeamMembers(teamId: string) {
  membersLoading.value = true
  try {
    const res = await $fetch<{ users: { id: string; name: string; email: string; role: string; teamId: string | null }[] }>('/api/admin/users')
    teamMembers.value = res.users.filter(u => u.teamId === teamId)
  } catch {
    toast.error('팀원 정보를 불러오지 못했습니다')
    teamMembers.value = []
  } finally {
    membersLoading.value = false
  }
}

async function assignLeader(teamId: string, userId: string) {
  try {
    await $fetch(`/api/admin/teams/${teamId}/leader`, { method: 'PATCH', body: { userId } })
    toast.success('팀장이 지정되었습니다')
    await loadTeamMembers(teamId)
  } catch {
    toast.error('팀장 지정에 실패했습니다')
  }
}

async function removeMember(teamId: string, userId: string) {
  if (!confirm('팀에서 제거하시겠습니까?')) return
  try {
    await $fetch(`/api/admin/teams/${teamId}/members`, { method: 'PATCH', body: { userId, action: 'remove' } })
    toast.success('팀원이 제거되었습니다')
    await loadTeamMembers(teamId)
    await refresh()
  } catch {
    toast.error('팀원 제거에 실패했습니다')
  }
}

function roleLabel(role: string) {
  if (role === 'LEADER') return '팀장'
  if (role === 'ADMIN') return '관리자'
  return '팀원'
}

function roleBadgeClass(role: string) {
  if (role === 'LEADER') return 'bg-accent-dim text-accent'
  if (role === 'ADMIN') return 'bg-red-100 text-red-600'
  return 'bg-elevated text-ink-muted'
}

async function createTeam() {
  if (!newTeamName.value.trim()) return
  createError.value = ''
  try {
    await $fetch('/api/teams', { method: 'POST', body: { name: newTeamName.value } })
    toast.success('팀이 생성되었습니다')
    newTeamName.value = ''
    showCreateForm.value = false
    await refresh()
  } catch (e: any) {
    createError.value = e?.data?.data?.message ?? '팀 생성에 실패했습니다'
  }
}

async function deleteTeam(id: string) {
  if (!confirm('팀을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/teams/${id}`, { method: 'DELETE' })
    toast.success('팀이 삭제되었습니다')
    if (expandedTeamId.value === id) {
      expandedTeamId.value = null
      teamMembers.value = []
    }
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
