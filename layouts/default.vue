<template>
  <div class="min-h-screen bg-base flex">
    <!-- Background grid texture -->
    <div class="fixed inset-0 opacity-[0.02] pointer-events-none" style="background-image: linear-gradient(#d4ddd0 1px, transparent 1px), linear-gradient(90deg, #d4ddd0 1px, transparent 1px); background-size: 40px 40px;" />

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-30 md:hidden"
      @click="sidebarOpen = false"
    />

    <GNB :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Desktop spacer (GNB is fixed, reserve its width) -->
    <div class="hidden md:block w-56 flex-shrink-0" />

    <main class="relative z-10 flex-1 min-w-0 overflow-y-auto">
      <!-- Mobile top bar -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-border bg-base sticky top-0 z-20 md:hidden">
        <button
          class="p-1.5 rounded-lg hover:bg-elevated text-ink-muted transition-colors"
          @click="sidebarOpen = true"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="font-display font-bold text-ink">RetroLens</span>
      </div>

      <slot />
    </main>

    <Toast />
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
</script>
