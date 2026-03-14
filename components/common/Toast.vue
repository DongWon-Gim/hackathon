<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          data-testid="toast-message"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-card text-sm font-medium min-w-[260px] max-w-sm"
          :class="toastClass(toast.type)"
        >
          <span class="text-base leading-none">{{ toastIcon(toast.type) }}</span>
          <span>{{ toast.message }}</span>
          <button class="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity" @click="remove(toast.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast()

function toastClass(type: string) {
  if (type === 'success') return 'bg-surface border-success/30 text-success'
  if (type === 'error') return 'bg-surface border-danger/30 text-danger'
  return 'bg-surface border-border text-ink'
}

function toastIcon(type: string) {
  if (type === 'success') return '✓'
  if (type === 'error') return '✕'
  return 'ℹ'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px) scale(0.96);
}
</style>
