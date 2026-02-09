<script lang="ts" setup>
import { computed } from 'vue';
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  name: 'T3CeRcgCloudimage',
  inheritAttrs: false
});

interface T3CeRcgCloudimage extends T3CeBaseProps {
  header: string;
  media: MediaRef[];
}

const props = withDefaults(defineProps<T3CeRcgCloudimage>(), {
  header: '',
  header_layout: 2 as number | string,
  media: () => [] as MediaRef[]
});

const mediaItems = computed(() => props.media ?? []);
const hasMedia = computed(() => mediaItems.value.length > 0);

const carouselUi = {
  dots: 'bottom-0',
  item: 'basis-1/3 sm:basis-1/4',
  container: 'gap-y-5 items-center pb-5',
};
</script>

<template>
  <UContainer>
    <T3HtmlParser class="text-center mb-3 lg:mb-7" :content="header"></T3HtmlParser>
<!-- desktop -->
    <div v-if="hasMedia" class="hidden w-full lg:flex flex-wrap gap-x-15 gap-y-7 justify-center ">
      <img v-for="item in mediaItems" :key="item.id" :alt="item.alt" :src="item.publicUrl" class="max-h-7" loading="lazy" decoding="async" />
    </div>

<!-- mobile -->
    <UCarousel
        v-slot="{ item }"
        v-if="hasMedia"
        :items="mediaItems"
        :ui="carouselUi"
        align="start"
        class="lg:hidden"
        dots
        auto-scroll
        loop
    >
      <img height="15" :alt="item.alt" :src="item.publicUrl" class="overflow-clip mx-auto" loading="lazy" decoding="async" />
    </UCarousel>
  </UContainer>
</template>