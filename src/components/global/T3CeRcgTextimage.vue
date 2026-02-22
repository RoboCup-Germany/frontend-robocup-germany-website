<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';
import Image from '~/components/basic/Image.vue';
import { pickFirstDisplayImage, toDisplayImage, type DisplayImage } from '~/utils/media-image';

defineOptions({
  inheritAttrs: false
});

type UiButtonColor = 'primary' | 'junior' | 'major';
type UiButtonVariant = 'solid' | 'outline';

type ContentButton = {
  button_text?: string;
  button_link?: LinkRef | null;
  button_size?: 'small' | 'medium' | 'large';
  button_type?: 'full' | 'outline' | 'solid';
  color_select?: 'main' | 'primary' | 'junior' | 'major' | 'secondary';
};

interface T3CeRcgTextimage extends T3CeBaseProps
{
  header?: string;
  header_layout?: number | string;
  bodytext?: string;
  button_text?: string;
  color_select?: ContentButton['color_select'];
  button_link?: LinkRef | null;
  button_size?: 'small' | 'medium' | 'large';
  button_type?: ContentButton['button_type'];
  buttons?: ContentButton[];
  orientation?: 'left' | 'right';
  image?: MediaRef[] | null;
  media?: MediaRef[] | Record<string, unknown> | null;
}

const props = withDefaults(defineProps<T3CeRcgTextimage>(), {
  header: '',
  header_layout: 2,
  bodytext: '',
  button_text: '',
  color_select: 'primary',
  button_link: null,
  button_size: 'medium',
  button_type: 'full',
  buttons: () => [],
  orientation: 'left',
  image: () => [] as MediaRef[],
  media: () => [] as MediaRef[]
});

const resolveColor = (value?: ContentButton['color_select']): UiButtonColor => {
  if (value === 'main') {
    return 'primary';
  }

  if (value === 'junior' || value === 'major') {
    return value;
  }

  if (value === 'secondary') {
    return 'major';
  }

  return 'primary';
};

const resolveVariant = (value?: ContentButton['button_type']): UiButtonVariant => {
  return value === 'outline' ? 'outline' : 'solid';
};

const normalizedButtons = computed(() => {
  const items = Array.isArray(props.buttons) ? props.buttons : [];

  if (items.length > 0) {
    return items
      .map((button) => {
        const label = button.button_text?.trim() || '';
        const link = button.button_link || null;
        const href = link?.url || link?.attr?.href || undefined;

        if (!label || !href) {
          return null;
        }

        return {
          label,
          to: link,
          size: button.button_size || 'medium',
          color: resolveColor(button.color_select),
          variant: resolveVariant(button.button_type)
        };
      })
      .filter((button): button is NonNullable<typeof button> => Boolean(button));
  }

  const legacyLabel = props.button_text?.trim() || '';
  const legacyLink = props.button_link;
  const legacyHref = legacyLink?.url || legacyLink?.attr?.href || undefined;

  if (!legacyLabel || !legacyHref) {
    return [];
  }

  return [{
    label: legacyLabel,
    to: legacyLink,
    size: props.button_size,
    color: resolveColor(props.color_select),
    variant: resolveVariant(props.button_type)
  }];
});

const hasButtons = computed(() => normalizedButtons.value.length > 0);

const displayImage = computed<DisplayImage | null>(() => {
  if (Array.isArray(props.media)) {
    return pickFirstDisplayImage(props.media) || pickFirstDisplayImage(props.image);
  }

  if (props.media && typeof props.media === 'object') {
    const parsed = toDisplayImage(props.media);
    if (parsed) {
      return parsed;
    }
  }

  return pickFirstDisplayImage(props.image);
});

const imageColumnClass = computed(() => {
  return props.orientation === 'right'
    ? 'xl:order-2'
    : 'xl:order-1';
});

const textColumnClass = computed(() => {
  return props.orientation === 'right'
    ? 'xl:order-1 xl:pr-5'
    : 'xl:order-2 xl:pl-5';
});

</script>

<template>
  <section class="mb-2 lg:mb-10">
    <UContainer class="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-center xl:gap-10">
      <div :class="['xl:col-span-6', imageColumnClass]">
        <Image v-if="displayImage" :display="displayImage" />
      </div>
      <div :class="['xl:col-span-6', textColumnClass]">
        <Headline class="mb-5 lg:mb-7" :raw-html="header"/>
        <T3HtmlParser class="rte-content" :content="bodytext"/>
        <div v-if="hasButtons" class="mt-10 flex flex-wrap items-center gap-4 lg:mt-15">
          <Button
            v-for="(button, index) in normalizedButtons"
            :key="`${button.label}-${index}`"
            :to="button.to"
            :size="button.size"
            :color="button.color"
            :variant="button.variant"
            :label="button.label"
          />
        </div>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
</style>
