<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  desktop?: ImageRef[];
}

const props = withDefaults(defineProps<Props>(), {});

const pickFirst = (arr?: ImageRef[]): ImageRef | null => {
  if (!arr || arr.length === 0) {
    return null;
  }
  const withUrl = arr.find(i => i && i.publicUrl);
  return withUrl || (arr[0] ?? null);
};

const desktopImage = computed<ImageRef | null>(() => pickFirst(props.desktop));
const desktopUrl = computed(() => desktopImage?.value?.publicUrl);

const alt = computed(() => desktopImage.value?.alt || '');
const title = computed(() => desktopImage.value?.title || '');
</script>

<template>
  <picture v-if=" desktopUrl ">
    <source v-if="desktopUrl" :srcset="desktopUrl"/>
    <img
      :src=" desktopUrl"
      :alt="alt"
      :title="title"
      loading="lazy"
      decoding="async"
      class="w-full h-full object-cover"
    />
  </picture>
</template>