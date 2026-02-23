<script setup lang="ts">
import { computed } from 'vue';
import type { DisplayImage } from '~/utils/media-image';

interface Props {
  display?: DisplayImage | null;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
  sizes?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  decoding: 'async',
  sizes: '(min-width: 1024px) 1200px, 100vw'
});

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

const resolvedFetchPriority = computed(() => {
  if (props.fetchpriority) return props.fetchpriority;
  return props.loading === 'eager' ? 'high' : 'low';
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
        :loading="props.loading"
        :decoding="props.decoding"
        :fetchpriority="resolvedFetchPriority"
        :sizes="props.sizes"
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
