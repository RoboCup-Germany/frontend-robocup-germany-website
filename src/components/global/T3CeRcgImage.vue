<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Image from '~/components/basic/Image.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgImage extends T3CeBaseProps
{
  customimage_mobile?: ImageRef[];
  customimage_desktop?: ImageRef[];
  customimage_wideDesktop?: ImageRef[];
}

const props = withDefaults(defineProps<T3CeRcgImage>(), {});
</script>

<template>
  <Image :mobile="customimage_mobile" :desktop="customimage_desktop" :wideDesktop="customimage_wideDesktop"/>
</template>
