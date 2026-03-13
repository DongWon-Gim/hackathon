<template>
  <span :class="badgeClass">{{ label }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  variant: 'active' | 'closed' | 'keep' | 'problem' | 'try' | 'admin' | 'leader' | 'member'
}>()

const badgeClass = computed(() => `badge badge-${props.variant}`)
</script>
