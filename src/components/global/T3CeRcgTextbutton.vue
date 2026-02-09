<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue'
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgTextButton extends T3CeBaseProps
{
  header: string;
  header_layout: number | string;
  subheader?: string;
  bodytext: string;
  button_text: string;
  color_select: 'primary' | 'secondary' | 'outline';
  button_link: LinkRef | null;
  button_size: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<T3CeRcgTextButton>(), {});

const hasButton = computed(() => {
  const label = props.button_text?.trim();
  const link = props.button_link;
  const href = link?.url || link?.attr?.href || undefined;
  return Boolean(label && href);
});

</script>

<template>
  <UContainer>
    <div class="flex flex-col xl:flex-row xl:justify-between xl:items-baseline">
      <div class="">
        <Headline :raw-html="header"/>
        <div v-if="subheader" class="mb-7 text-base italic uppercase tracking-wide text-black font-semibold">
          <T3HtmlParser :content="subheader" />
        </div>
        <T3HtmlParser v-if="bodytext" :content="bodytext"></T3HtmlParser>
      </div>
      <div v-if="hasButton" class="mt-9 xl:mt-0 xl:ml-8 flex-shrink-0">
        <Button :to="button_link" :color="color_select" :size="button_size" :label="button_text" />
      </div>
    </div>
  </UContainer>
</template>
