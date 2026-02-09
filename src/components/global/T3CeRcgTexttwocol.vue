<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgTexttwocol extends T3CeBaseProps
{
  header: string;
  header_layout: number | string;
  bodytext: string;
  button_text: string;
  color_select: 'primary' | 'secondary' | 'outline';
  button_link: LinkRef;
  button_size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<T3CeRcgTexttwocol>(), {
  header: '',
  header_layout: 2,
  bodytext: '',
  button_text: '',
  color_select: 'primary',
  button_size: 'medium'
});

</script>

<template>
  <UContainer class="xl:grid">
    <div class="xl:col-span-5 mb-5 lg:mb-7 xl:mb-0" v-if="header">
      <Headline :raw-html="header"/>
    </div>
    <div class="xl:col-span-7">
      <T3HtmlParser v-if="bodytext" :content="bodytext"></T3HtmlParser>
      <Button :to="button_link" class="mt-9" :color="color_select" :size="button_size" :label="button_text">{{ button_text }}</Button>
    </div>
  </UContainer>
</template>
