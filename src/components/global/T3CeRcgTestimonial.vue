<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgTestimonial extends T3CeBaseProps
{
  testimonials: TestimonialRef[];
}

const props = withDefaults(defineProps<T3CeRcgTestimonial>(), {});

const carouselUi = computed(() => ({
  dot: 'bg-black',
  item: 'basis-full',
  container: 'justify-around',
  dots: props.testimonials.length <= 1 ? 'hidden' : ''
}));
</script>

<template>
  <section class="bg-secondary w-full">
    <UContainer>
      <UCarousel
          v-slot="{ item }"
          :items="testimonials"
          :ui="carouselUi"
          align="start"
          dots
          autoplay
      >
        <div class="mx-6 mt-10 mb-20 md:m-23">
          <p class="copy2">
            <b>{{ item.name }}&nbsp;</b>
            <span class="max-md:block">{{ item.position }}, {{ item.organization }}</span>
          </p>
          <Headline class="h2 mt-2 md:mt-4" :raw-html="item.text"/>
        </div>
      </UCarousel>
    </UContainer>
  </section>
</template>