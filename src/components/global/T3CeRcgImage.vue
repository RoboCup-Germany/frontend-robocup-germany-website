<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Image from '~/components/basic/Image.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgImage extends T3CeBaseProps
{
  header_layout: number | string;
  customimage_desktop?: ImageRef[];
}

const props = withDefaults(defineProps<T3CeRcgImage>(), {
  header_layout: 2,
  customimage_desktop: null
});
</script>

<template>
  <UContainer>
    <div class="flex flex-col xl:flex-row xl:justify-between xl:items-baseline">
      <Image :desktop="customimage_desktop"/>
    </div>
  </UContainer>
</template>
