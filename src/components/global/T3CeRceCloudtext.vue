<script setup lang="ts">
import { computed } from 'vue';
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';

defineOptions({
  name: 'T3CeRcgCloudtext',
  inheritAttrs: false
});

interface T3CeRcgCloudtext extends T3CeBaseProps {
  tx_theme_domain_model_cloudtexts: {
    indicator: string;
    bodytext: string;
  }[];
}

const props = withDefaults(defineProps<T3CeRcgCloudtext>(), {
  tx_theme_domain_model_cloudtexts: () => [] as T3CeRcgCloudtext['tx_theme_domain_model_cloudtexts']
});

const isScrollable = computed(() => {
  const length = props.tx_theme_domain_model_cloudtexts?.length ?? 0;
  if (length <= 1) return 'hidden';
  if (length <= 3) return 'lg:hidden';
  if (length <= 4) return '2xl:hidden';
  return '';
});

const carouselUi = computed(() => ({
  dot: 'bg-secondary',
  item: 'basis-full lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4 ',
  container: 'justify-around',
  dots: isScrollable.value
}));
</script>

<template>
  <div class="bg-black text-secondary w-full">
    <UContainer>
      <UCarousel
          v-slot="{ item }"
          :items="tx_theme_domain_model_cloudtexts"
          :ui="carouselUi"
          align="start"
          dots
          auto-scroll
          loop
          class="pt-15 pb-10 lg:pt-25 lg:pb-15"
      >
        <div class="px-12 mb-15 text-center">
          <p class="number"><b>{{ item.indicator }}</b></p>
          <p class="copy2">{{ item.bodytext }}</p>
        </div>
      </UCarousel>
    </UContainer>
  </div>
</template>