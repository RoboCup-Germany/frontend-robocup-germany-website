<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Image from '~/components/basic/Image.vue';
import { pickFirstDisplayImage } from '~/utils/media-image';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgImage extends T3CeBaseProps
{
  header_layout?: number | string;
  customimage_desktop?: ImageRef[];
}

const _props = withDefaults(defineProps<T3CeRcgImage>(), {
  header_layout: 2,
  customimage_desktop: null
});

const displayImage = computed(() => {
  return pickFirstDisplayImage(_props.customimage_desktop);
});

const imageDescription = computed(() => {
  const value = displayImage.value?.description ?? '';
  return value.trim();
});
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-3">
      <Image :display="displayImage" />
      <p v-if="imageDescription" class="text-sm leading-relaxed text-gray-700 italic">
        {{ imageDescription }}
      </p>
    </div>
  </UContainer>
</template>
