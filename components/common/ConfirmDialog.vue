<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" @click="$emit('cancel')" />
        <div class="relative z-10 card max-w-sm w-full p-6">
          <h3 class="font-display font-bold text-ink mb-2">{{ title }}</h3>
          <p class="text-sm text-ink-muted mb-6">{{ message }}</p>
          <div class="flex gap-3 justify-end">
            <button class="btn-ghost text-sm" @click="$emit('cancel')">취소</button>
            <button :class="confirmClass" class="btn text-sm" @click="$emit('confirm')">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  variant?: 'danger' | 'primary'
}>(), { confirmText: '확인', variant: 'primary' })

defineEmits(['confirm', 'cancel'])

const confirmClass = computed(() =>
  props.variant === 'danger' ? 'btn-danger' : 'btn-primary'
)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
