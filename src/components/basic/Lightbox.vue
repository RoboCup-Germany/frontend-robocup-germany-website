<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useLightbox } from '~/composables/useLightbox';

const { activeImage, close } = useLightbox();

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close();
}

watch(activeImage, (value) => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.overflow = value ? 'hidden' : '';
});

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox-fade">
      <div
        v-if="activeImage"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-[color-mix(in_srgb,var(--color-black)_85%,transparent)] cursor-zoom-out clamp-padding"
        @click.self="close"
      >
        <button
          type="button"
          class="absolute top-[calc(var(--spacing)*3)] right-[calc(var(--spacing)*3)] flex items-center justify-center w-[calc(var(--spacing)*8)] h-[calc(var(--spacing)*8)] border-none rounded-full bg-[color-mix(in_srgb,var(--color-white)_15%,transparent)] text-white font-sans text-lg leading-none p-0 cursor-pointer transition-colors duration-200 ease-in-out hover:bg-[var(--color-primary)] hover:text-white"
          aria-label="Bild schließen"
          @click="close"
        >
          <span aria-hidden="true" class="flex items-center justify-center -mt-[3.5px]">&times;</span>
        </button>

        <img
          :src="activeImage.src"
          :alt="activeImage.alt || ''"
          :width="activeImage.width"
          :height="activeImage.height"
          class="block max-w-full max-h-full w-auto h-auto cursor-default shadow-[0_10px_40px_color-mix(in_srgb,var(--color-black)_50%,transparent)]"
        >
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.clamp-padding {
  padding: clamp(calc(var(--spacing) * 3), 4vw, calc(var(--spacing) * 8));
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.2s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>