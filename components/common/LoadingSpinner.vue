<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div
      class="rounded-full border-2 border-border border-t-accent animate-spin"
      :class="spinnerClass"
    />
    <span v-if="label" class="ml-3 text-sm text-ink-muted">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  label?: string
  fullPage?: boolean
}>(), { size: 'md' })

const spinnerClass = computed(() => ({
  'w-4 h-4': props.size === 'sm',
  'w-6 h-6': props.size === 'md',
  'w-10 h-10': props.size === 'lg'
}))

const containerClass = computed(() => ({
  'min-h-[200px]': props.fullPage
}))
</script>
