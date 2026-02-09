<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgTextimage extends T3CeBaseProps
{
  header: string;
  header_layout: number | string;
  bodytext: string;
  button_text: string;
  color_select: 'primary' | 'secondary' | 'outline';
  button_link: LinkRef | null;
  button_size: 'small' | 'medium' | 'large';
  orientation: 'left' | 'right';
  media: MediaRef[];
}

const props = withDefaults(defineProps<T3CeRcgTextimage>(), {});

</script>

<template>
  <section class="mb-2">
    <UContainer class="xl:grid">
      <div :class="['mb-5 xl:mb-0 xl:col-span-6', orientation === 'left' ? 'xl:order-2' : '']">
          <img
              :src="props.media[0].publicUrl"
              :alt="props.media[0].alt || ''"
              :title="props.media[0].title || ''"
          />
      </div>
      <div :class="['xl:col-span-6', orientation === 'left' ? 'xl:order-1 xl:mr-5' : 'xl:ml-5']">
        <Headline class="mb-5 lg:mb-7" :raw-html="header"/>
        <T3HtmlParser :content="bodytext"/>
        <Button :to="button_link" :size="button_size" :color="color_select" :label="button_text" class="mt-10 lg:mt-15"></Button>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
</style>