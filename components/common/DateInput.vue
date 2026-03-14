<template>
  <input
    :value="modelValue"
    type="date"
    class="input cursor-pointer"
    :class="inputClass"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @click="($event.target as HTMLInputElement).showPicker()"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  inputClass?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
