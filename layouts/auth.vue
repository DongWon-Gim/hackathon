<template>
  <div class="min-h-screen bg-base flex items-center justify-center p-4">
    <!-- Background grid texture -->
    <div class="fixed inset-0 opacity-[0.03]" style="background-image: linear-gradient(#e2e8f4 1px, transparent 1px), linear-gradient(90deg, #e2e8f4 1px, transparent 1px); background-size: 40px 40px;" />

    <!-- Accent glow -->
    <div class="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

    <div class="relative z-10 w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="text-accent">
              <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
            </svg>
          </div>
          <span class="font-display text-xl font-bold text-ink">RetroLens</span>
        </div>
        <p class="text-xs text-ink-muted font-mono">AI-powered retrospective insights</p>
      </div>

      <slot />
    </div>
  </div>
</template>
