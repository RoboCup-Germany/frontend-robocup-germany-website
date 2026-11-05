<script setup lang="ts">
import { NuxtImg } from '#components';
import { computed } from 'vue';
import type { TextImageView } from '~/utils/textimage';

const props = withDefaults(defineProps<{
  image: TextImageView;
  /** Fill the parent box (slideshow) instead of flowing with the width of the grid cell. */
  fill?: boolean;
}>(), {
  fill: false
});

const wrapperClass = computed(() => props.fill ? 'h-full w-full' : 'w-full');
const imgClass = computed(() => props.fill
  ? 'block h-full w-full object-contain'
  : ['block h-auto w-full object-contain', props.image.imageClass]);
</script>

<template>
  <div :class="['group relative overflow-hidden', wrapperClass]">
    <picture v-if="image.srcsetDefault || image.srcsetSmall" :class="['block', fill ? 'h-full' : '']">
      <source
        v-if="image.srcsetSmall"
        :srcset="image.srcsetSmall"
        media="(max-width: 767px)"
        :sizes="image.sizes"
      >
      <source
        v-if="image.srcsetDefault"
        :srcset="image.srcsetDefault"
        media="(min-width: 768px)"
        :sizes="image.sizes"
      >
      <img
        :src="image.src"
        :srcset="image.srcsetDefault || undefined"
        :alt="image.alt"
        :title="image.title"
        :class="['rcg-textimage-image', imgClass]"
        :width="image.width"
        :height="image.height"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        draggable="false"
        :sizes="image.sizes"
      >
    </picture>
    <picture v-else :class="['block', fill ? 'h-full' : '']">
      <source
        v-if="image.srcSmall"
        :srcset="image.srcSmall"
        media="(max-width: 767px)"
      >
      <NuxtImg
        provider="ipx"
        :src="image.src"
        :alt="image.alt"
        :title="image.title"
        :class="['rcg-textimage-image', imgClass]"
        :width="image.width"
        :height="image.height"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        draggable="false"
        :sizes="image.nuxtSizes"
        format="webp"
        :quality="80"
      />
    </picture>
    <div
      v-if="image.creator"
      class="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-tl-md bg-black/65 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
    >
      <span class="text-xs leading-none">©</span>
      <span>{{ image.creator }}</span>
    </div>
  </div>
</template>
