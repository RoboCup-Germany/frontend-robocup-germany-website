<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Headline from '~/components/basic/Headline.vue';
import Image from "~/components/basic/Image.vue";

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgGallery extends T3CeBaseProps
{
  images: MediaRef[];
}

const props = withDefaults(defineProps<T3CeRcgGallery>(), {});

const carouselUi = computed(() => ({
  dot: 'bg-black',
  item: 'basis-full',
  container: 'justify-around',
  dots: props.images.length <= 1 ? 'hidden' : ''
}));
</script>

<template>
  <section class="bg-secondary w-full">
    <UContainer>
      <UCarousel
          v-slot="{ item }"
          :items="images"
          :ui="carouselUi"
          align="start"
          dots
          autoplay
      >
        <div class="mx-6 mt-10 mb-20 md:m-23">
          <p class="copy2">
            <Image :desktop="item"/>
          </p>
        </div>
      </UCarousel>
    </UContainer>
  </section>
</template>