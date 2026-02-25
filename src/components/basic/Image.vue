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
const imageSrc = computed<string | null>(() => {
  return urlDefault.value || urlSmall.value;
});

const alt = computed(() => props.display?.alt ?? '');
const title = computed(() => props.display?.title ?? '');
const width = computed<number | undefined>(() => {
  return props.display?.width && props.display.width > 0 ? props.display.width : undefined;
});
const height = computed<number | undefined>(() => {
  return props.display?.height && props.display.height > 0 ? props.display.height : undefined;
});
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
  <div v-if="imageSrc" class="relative group overflow-hidden">
    <NuxtImg
      :src="imageSrc || ''"
      :alt="alt || ''"
      :title="title || ''"
      :width="width"
      :height="height"
      :loading="props.loading"
      :decoding="props.decoding"
      :fetchpriority="resolvedFetchPriority"
      :sizes="props.sizes"
      densities="x1 x2"
      format="webp"
      :quality="80"
      class="block h-auto w-full"
    />
    <div
      v-if="creator"
      class="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-1 bg-black/65 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-tl-md"
    >
      <UIcon name="i-lucide-copyright" class="size-3.5 shrink-0" />
      <span>{{ creator }}</span>
    </div>
  </div>
</template>
