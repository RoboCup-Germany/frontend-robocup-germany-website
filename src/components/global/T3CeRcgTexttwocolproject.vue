<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgTexttwocolproject extends T3CeBaseProps
{
  header: string;
  header_layout: number | string;
  bodytext?: string;
  button_text?: string;
  color_select?: 'primary' | 'secondary' | 'outline';
  button_link?: LinkRef;
  button_size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<T3CeRcgTexttwocolproject>(), {
  header_layout: 2,
  color_select: 'primary',
  button_size: 'medium'
});

</script>

<template>
  <UContainer class="grid">
    <div class="col-span-12 info">{{ $t('solutions') }}</div>
    <Headline class="col-span-12 lg:col-span-6 h3" v-if="header" :level="header_layout"
              :raw-html="header"/>
    <T3HtmlParser class="col-span-12 lg:col-span-6" v-if="bodytext" :content="bodytext"></T3HtmlParser>
  </UContainer>
</template>
