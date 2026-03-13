<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-12 h-12 rounded-full bg-elevated border border-border flex items-center justify-center mb-4">
      <span class="text-xl text-ink-muted">{{ icon }}</span>
    </div>
    <p class="text-ink-muted text-sm mb-1">{{ message }}</p>
    <p v-if="subMessage" class="text-ink-subtle text-xs">{{ subMessage }}</p>
    <NuxtLink v-if="actionTo" :to="actionTo" class="btn-primary mt-4 text-xs">
      {{ actionText }}
    </NuxtLink>
    <button v-else-if="actionText" class="btn-secondary mt-4 text-xs" @click="$emit('action')">
      {{ actionText }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  subMessage?: string
  icon?: string
  actionText?: string
  actionTo?: string
}>()

defineEmits(['action'])
</script>
