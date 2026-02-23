<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visibleDots: number[]
  activeIndex: number
  showArrows?: boolean
  animateDots?: boolean
  transitionName?: string
  mode?: 'overlay' | 'inline'
  prevLabel?: string
  nextLabel?: string
  dotLabelPrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  showArrows: true,
  animateDots: false,
  transitionName: 'dots-forward',
  mode: 'overlay',
  prevLabel: 'Vorheriges Bild',
  nextLabel: 'Nächstes Bild',
  dotLabelPrefix: 'Bild'
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
const isInlineMode = computed(() => props.mode === 'inline')
</script>

<template>
  <div
    v-if="hasDots || showArrows"
    :class="isInlineMode ? 'w-full' : 'pointer-events-none absolute inset-x-0 bottom-0 z-20'"
  >
    <div
      v-if="!isInlineMode"
      aria-hidden="true"
      role="presentation"
      class="mx-auto h-[100px] w-[300px] translate-y-[64%] rounded-[50px] bg-white"
    />

    <div
      class="pointer-events-auto z-30 h-8 w-[220px]"
      :class="isInlineMode
        ? 'mx-auto flex items-center justify-between'
        : 'absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-3'"
    >
      <button
        v-if="showArrows"
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-primary transition-all duration-200 ease-out hover:scale-[1.06] hover:bg-primary hover:text-white"
        :class="isInlineMode ? '' : 'absolute left-0 top-1/2 -translate-y-1/2'"
        :aria-label="prevLabel"
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
        class="flex items-center justify-center gap-2"
        :class="isInlineMode ? '' : 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'"
      >
        <span v-for="i in visibleDots" :key="i" class="dot-item">
          <button
            type="button"
            class="h-2.5 w-2.5 rounded-full bg-primary opacity-60 transition-transform duration-200 ease-out"
            :class="{ '!opacity-100': i === activeIndex }"
            :style="dotStyle(i)"
            :aria-label="`${dotLabelPrefix} ${i + 1}`"
            @click="emit('select', i)"
          />
        </span>
      </TransitionGroup>

      <div
        v-else
        class="flex items-center justify-center gap-2"
        :class="isInlineMode ? '' : 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'"
      >
        <button
          v-for="i in visibleDots"
          :key="i"
          type="button"
          class="h-2.5 w-2.5 rounded-full bg-primary opacity-60 transition-transform duration-200 ease-out"
          :class="{ '!opacity-100': i === activeIndex }"
          :style="dotStyle(i)"
          :aria-label="`${dotLabelPrefix} ${i + 1}`"
          @click="emit('select', i)"
        />
      </div>

      <button
        v-if="showArrows"
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-primary transition-all duration-200 ease-out hover:scale-[1.06] hover:bg-primary hover:text-white"
        :class="isInlineMode ? '' : 'absolute right-0 top-1/2 -translate-y-1/2'"
        :aria-label="nextLabel"
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
