<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visibleDots: number[]
  activeIndex: number
  showArrows?: boolean
  animateDots?: boolean
  transitionName?: string
}

const props = withDefaults(defineProps<Props>(), {
  showArrows: true,
  animateDots: false,
  transitionName: 'dots-forward'
})

const emit = defineEmits<{
  prev: []
  next: []
  select: [index: number]
}>()

const dotScale = (index: number): number => {
  const d = Math.abs(index - props.activeIndex)
  if (d === 0) return 1
  if (d === 1) return 0.75
  if (d === 2) return 0.55
  return 0.45
}

const dotStyle = (index: number) => {
  return { transform: `scale(${dotScale(index)})` }
}

const hasDots = computed(() => props.visibleDots.length > 0)
</script>

<template>
  <div v-if="hasDots || showArrows" class="pointer-events-none absolute inset-x-0 bottom-0 z-20">
    <div
      aria-hidden="true"
      role="presentation"
      class="mx-auto h-[100px] w-[300px] translate-y-[64%] rounded-[50px] bg-white"
    />

    <div
      class="pointer-events-auto absolute bottom-2 left-1/2 z-30 h-8 w-[220px] -translate-x-1/2 translate-y-3"
    >
      <button
        v-if="showArrows"
        type="button"
        class="absolute left-0 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary transition-all duration-200 ease-out hover:scale-[1.06] hover:bg-primary hover:text-white"
        aria-label="Vorheriges Bild"
        @click="emit('prev')"
      >
        <svg viewBox="0 0 1080 1080" class="h-3 w-3 rotate-90" fill="none" aria-hidden="true">
          <polyline
            points="841.93 389.03 540 690.97 238.07 389.03"
            stroke="currentColor"
            stroke-width="110"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <TransitionGroup
        v-if="animateDots"
        :name="transitionName"
        tag="div"
        class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2"
      >
        <span v-for="i in visibleDots" :key="i" class="dot-item">
          <button
            type="button"
            class="h-2.5 w-2.5 rounded-full bg-primary opacity-60 transition-transform duration-200 ease-out"
            :class="{ '!opacity-100': i === activeIndex }"
            :style="dotStyle(i)"
            :aria-label="`Bild ${i + 1}`"
            @click="emit('select', i)"
          />
        </span>
      </TransitionGroup>

      <div
        v-else
        class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2"
      >
        <button
          v-for="i in visibleDots"
          :key="i"
          type="button"
          class="h-2.5 w-2.5 rounded-full bg-primary opacity-60 transition-transform duration-200 ease-out"
          :class="{ '!opacity-100': i === activeIndex }"
          :style="dotStyle(i)"
          :aria-label="`Bild ${i + 1}`"
          @click="emit('select', i)"
        />
      </div>

      <button
        v-if="showArrows"
        type="button"
        class="absolute right-0 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary transition-all duration-200 ease-out hover:scale-[1.06] hover:bg-primary hover:text-white"
        aria-label="Nächstes Bild"
        @click="emit('next')"
      >
        <svg viewBox="0 0 1080 1080" class="h-3 w-3 -rotate-90" fill="none" aria-hidden="true">
          <polyline
            points="841.93 389.03 540 690.97 238.07 389.03"
            stroke="currentColor"
            stroke-width="110"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dot-item {
  display: inline-flex;
  will-change: transform, opacity;
}

.dots-forward-enter-active,
.dots-forward-leave-active,
.dots-backward-enter-active,
.dots-backward-leave-active {
  transition: transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 220ms ease;
}

.dots-forward-leave-active,
.dots-backward-leave-active {
  position: absolute;
}

.dots-forward-move,
.dots-backward-move {
  transition: transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.dots-forward-enter-from,
.dots-backward-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

.dots-forward-leave-to,
.dots-backward-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
