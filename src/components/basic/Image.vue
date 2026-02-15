<script setup lang="ts">
import { computed } from 'vue';

type DisplayImage = {
  urlDefault?: string | null;
  urlSmall?: string | null;
  alt?: string | null;
  title?: string | null;
};

interface Props {
  // Legacy: array of ImageRef with publicUrl
  desktop?: ImageRef[] | null;
  // New: normalized display image with crop variants
  display?: DisplayImage | null;
}

const props = withDefaults(defineProps<Props>(), {});

const pickFirst = (arr?: ImageRef[] | null): ImageRef | null => {
  if (!arr || arr.length === 0) return null;
  const withUrl = arr.find(i => i && i.publicUrl);
  return withUrl || (arr[0] ?? null);
};

const legacyImage = computed<ImageRef | null>(() => pickFirst(props.desktop ?? null));

const urlDefault = computed<string | null>(() => {
  if (props.display?.urlDefault) return props.display.urlDefault;
  return legacyImage.value?.publicUrl ?? null;
});

const urlSmall = computed<string | null>(() => {
  if (props.display?.urlSmall) return props.display.urlSmall;
  // fallback: use default if no explicit small
  return urlDefault.value;
});

const alt = computed(() => props.display?.alt ?? legacyImage.value?.alt ?? '');
const title = computed(() => props.display?.title ?? legacyImage.value?.title ?? '');
</script>

<template>
  <picture v-if="urlDefault">
    <!-- On lg and above use default crop; below use small (or default as fallback) -->
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
</template>