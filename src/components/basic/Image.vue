<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  mobile?: ImageRef[];
  desktop?: ImageRef[];
  wideDesktop?: ImageRef[];
}

const props = withDefaults(defineProps<Props>(), {});

const pickFirst = (arr?: ImageRef[]): ImageRef | null => {
  if (!arr || arr.length === 0) {
    return null;
  }
  const withUrl = arr.find(i => i && i.publicUrl);
  return withUrl || (arr[0] ?? null);
};

const mobileImage = computed<ImageRef | null>(() => pickFirst(props.mobile));
const desktopImage = computed<ImageRef | null>(() => pickFirst(props.desktop));
const wideDesktopImage = computed<ImageRef | null>(() => pickFirst(props.wideDesktop));

const mobileUrl = computed(() => mobileImage?.value?.publicUrl);
const desktopUrl = computed(() => desktopImage?.value?.publicUrl);
const wideUrl = computed(() => wideDesktopImage?.value?.publicUrl);

// TODO erstmal feste Reihenfolge, aber eigentlich ausgespieltes Bild berechnen
const alt = computed(() => mobileImage.value?.alt || desktopImage.value?.alt || wideDesktopImage.value?.alt || '');
const title = computed(() => mobileImage.value?.title || desktopImage.value?.alt || wideDesktopImage.value?.title || '');
</script>

<template>
  <picture v-if="mobileUrl || desktopUrl || wideUrl">
    <source v-if="wideUrl" :srcset="wideUrl" media="(min-width: 1320px)" />
    <source v-if="desktopUrl" :srcset="desktopUrl" media="(min-width: 768px)" />
    <img
      :src="mobileUrl || desktopUrl || wideUrl || ''"
      :alt="alt"
      :title="title"
      loading="lazy"
      decoding="async"
      class="w-full h-full object-cover"
    />
  </picture>
</template>