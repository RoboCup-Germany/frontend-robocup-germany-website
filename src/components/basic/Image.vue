<script setup lang="ts">
import { computed } from 'vue';
import type { DisplayImage } from '~/utils/media-image';

interface Props {
  display?: DisplayImage | null;
}

const props = withDefaults(defineProps<Props>(), {});

const urlDefault = computed<string | null>(() => {
  return props.display?.urlDefault ?? null;
});

const urlSmall = computed<string | null>(() => {
  return props.display?.urlSmall ?? urlDefault.value;
});

const alt = computed(() => props.display?.alt ?? '');
const title = computed(() => props.display?.title ?? '');
const creator = computed(() => {
  const value = props.display?.creator ?? '';
  return value.trim();
});
</script>

<template>
  <div v-if="urlDefault" class="relative group overflow-hidden">
    <!-- On lg and above use default crop; below use small (or default as fallback) -->
    <picture>
      <source :srcset="urlDefault || ''" media="(min-width: 1024px)" />
      <img
        :src="urlSmall || urlDefault || ''"
        :alt="alt || ''"
        :title="title || ''"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover"
      />
    </picture>
    <div
      v-if="creator"
      class="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-1 bg-black/65 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-tl-md"
    >
      <UIcon name="i-lucide-copyright" class="size-3.5 shrink-0" />
      <span>{{ creator }}</span>
    </div>
  </div>
</template>
