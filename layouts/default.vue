<template>
  <div class="min-h-screen bg-base">
    <!-- Background grid texture -->
    <div class="fixed inset-0 opacity-[0.02] pointer-events-none" style="background-image: linear-gradient(#e2e8f4 1px, transparent 1px), linear-gradient(90deg, #e2e8f4 1px, transparent 1px); background-size: 40px 40px;" />

    <GNB />

    <main class="relative z-10">
      <slot />
    </main>

    <Toast />
  </div>
</template>
