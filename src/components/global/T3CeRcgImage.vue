<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import { pickFirstDisplayImage } from '~/utils/media-image';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgImage extends T3CeBaseProps
{
  header_layout?: number | string;
  customimage_desktop?: unknown;
}

const _props = withDefaults(defineProps<T3CeRcgImage>(), {
  header_layout: 2,
  customimage_desktop: null
});

const normalizedDesktopImages = computed<ImageRef[]>(() => {
  return Array.isArray(_props.customimage_desktop)
    ? _props.customimage_desktop as ImageRef[]
    : [];
});

const displayImage = computed(() => {
  return pickFirstDisplayImage(normalizedDesktopImages.value);
});

const imageDescription = computed(() => {
  const value = displayImage.value?.description ?? '';
  return value.trim();
});

const imageSrcDefault = computed(() => displayImage.value?.urlDefault || null);
const imageSrcSmall = computed(() => displayImage.value?.urlSmall || null);
const imageSrc = computed(() => imageSrcDefault.value || imageSrcSmall.value || null);

const imageAlt = computed(() => displayImage.value?.alt ?? '');
const imageTitle = computed(() => displayImage.value?.title ?? '');
const imageWidth = computed<number | undefined>(() => {
  const value = displayImage.value?.width;
  return value && value > 0 ? value : undefined;
});
const imageHeight = computed<number | undefined>(() => {
  const value = displayImage.value?.height;
  return value && value > 0 ? value : undefined;
});
const imageCreator = computed(() => {
  const value = displayImage.value?.creator ?? '';
  return value.trim();
});
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-3">
      <div v-if="imageSrc" class="rcg-image-fixed relative group overflow-hidden">
        <picture class="block">
          <source
            v-if="imageSrcSmall"
            :srcset="imageSrcSmall"
            media="(max-width: 767px)"
          >
          <NuxtImg
            provider="ipx"
            :src="imageSrc"
            :alt="imageAlt"
            :title="imageTitle"
            class="block h-auto w-full"
            :width="imageWidth"
            :height="imageHeight"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            sizes="100vw lg:1200px"
            format="webp"
            :quality="80"
          />
        </picture>
        <div
          v-if="imageCreator"
          class="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-tl-md bg-black/65 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <span class="text-xs leading-none">©</span>
          <span>{{ imageCreator }}</span>
        </div>
      </div>
      <p v-if="imageDescription" class="text-sm leading-relaxed text-gray-700 italic">
        {{ imageDescription }}
      </p>
    </div>
  </UContainer>
</template>

<style scoped>
.rcg-image-fixed :deep(img) {
  max-height: 520px;
  width: auto;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}
</style>
