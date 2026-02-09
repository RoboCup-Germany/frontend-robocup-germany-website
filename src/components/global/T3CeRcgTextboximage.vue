<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import {computed} from 'vue';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';
import Image from '~/components/basic/Image.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgTextboximage extends T3CeBaseProps
{
  header: string;
  header_layout: number | string;
  bodytext: string;
  button_text: string;
  color_select: 'primary' | 'secondary' | 'outline';
  button_link: LinkRef | null;
  button_size: 'small' | 'medium' | 'large';
  orientation: 'left' | 'right';
  customimage_mobile: ImageRef[];
  customimage_desktop: ImageRef[];
  customimage_wideDesktop: ImageRef[];
}

const props = withDefaults(defineProps<T3CeRcgTextboximage>(), {});

const backgroundClass = computed(() => props.orientation == 'left'
    ? 'max-xl:bg-primary xl:bg-linear-to-r from-primary from-0% via-65% via-primary to-transparent to-65% '
    : 'max-xl:bg-secondary xl:bg-linear-to-l from-secondary from-0% via-65% via-secondary to-transparent to-65% '
);
</script>

<template>
  <section :class="backgroundClass">
    <UContainer class="xl:grid xl:grid-cols-13 3xl:grid-cols-13">
      <Image :mobile="customimage_mobile"
             :desktop="customimage_desktop"
             :wideDesktop="customimage_wideDesktop"
             :class="[orientation === 'left' ? 'block ml-[-30px] lg:ml-[-70px] xl:ml-0 xl:col-start-8 xl:col-end-14 xl:order-last' : 'block mr-[-30px] lg:mr-[-70px] xl:mr-0 xl:col-start-1 xl:col-end-7']"
      />
      <div :class="['pt-10 pb-20', orientation === 'left' ? 'text-white xl:col-start-1 xl:col-end-7' : 'xl:col-start-8 xl:col-end-14 xl:order-last']">
        <div class="infotext mb-2">{{ $t('problems') }}</div>
        <Headline class="mb-10 md:mb-15" :raw-html="header"/>
        <div class="infotext mb-2">{{ $t('solutions') }}</div>
        <T3HtmlParser class="" :content="bodytext"/>
        <Button :to="button_link" :size="button_size" :color="color_select" :label="button_text" class="mt-14 md:mt-9"></Button>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
</style>