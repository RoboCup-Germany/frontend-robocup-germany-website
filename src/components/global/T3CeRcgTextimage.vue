<script setup lang="ts">
import { NuxtImg } from '#components';
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';
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
  button_text?: string
  color_select?: ContentButton['color_select'];
  button_link?: LinkRef | null;
  button_size?: 'small' | 'medium' | 'large';
  button_type?: ContentButton['button_type'];
  buttons?: ContentButton[];
  orientation?: 'left' | 'right';
  image?: unknown;
  media?: unknown;
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

const normalizedImageList = computed<MediaRef[]>(() => {
  return Array.isArray(props.image)
    ? props.image as MediaRef[]
    : [];
});

const normalizedMediaList = computed<MediaRef[]>(() => {
  return Array.isArray(props.media)
    ? props.media as MediaRef[]
    : [];
});

const normalizedMediaRecord = computed<Record<string, unknown> | null>(() => {
  return props.media && typeof props.media === 'object' && !Array.isArray(props.media)
    ? props.media as Record<string, unknown>
    : null;
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
  const fromImageList = pickFirstDisplayImage(normalizedImageList.value);

  if (normalizedMediaList.value.length > 0) {
    return fromImageList || pickFirstDisplayImage(normalizedMediaList.value);
  }

  if (fromImageList) {
    return fromImageList;
  }

  if (normalizedMediaRecord.value) {
    const parsed = toDisplayImage(normalizedMediaRecord.value);
    if (parsed) {
      return parsed;
    }
  }

  return null;
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

const imageSrcDefault = computed(() => displayImage.value?.urlDefault || null);
const imageSrcSmall = computed(() => displayImage.value?.urlSmall || null);
const imageSrc = computed(() => imageSrcDefault.value || imageSrcSmall.value || null);
const imageSrcsetDefault = computed(() => displayImage.value?.srcsetDefault || null);
const imageSrcsetSmall = computed(() => displayImage.value?.srcsetSmall || null);

const imageAlt = computed(() => displayImage.value?.alt ?? '');
const imageTitle = computed(() => displayImage.value?.title ?? '');
const imageWidth = computed<number | undefined>(() => {
  const value = displayImage.value?.width;
  return value && value > 0 ? value : undefined;
});
const imageHeight = computed<number | undefined>(() => {
  const value = displayImage.value?.height;
  return value && value > 0 ? value : undefined;
});
const imageCreator = computed(() => {
  const value = displayImage.value?.creator ?? '';
  return value.trim();
});

</script>

<template>
  <section class="mb-2 lg:mb-10">
    <UContainer class="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-center xl:gap-10">
      <div :class="['xl:col-span-6', imageColumnClass]">
        <div v-if="imageSrc" class="rcg-textimage-fixed relative group overflow-hidden">
          <picture v-if="imageSrcsetDefault || imageSrcsetSmall" class="block">
            <source
              v-if="imageSrcsetSmall"
              :srcset="imageSrcsetSmall"
              media="(max-width: 767px)"
            >
            <source
              v-if="imageSrcsetDefault"
              :srcset="imageSrcsetDefault"
              media="(min-width: 768px)"
              sizes="50vw"
            >
            <img
              :src="imageSrc"
              :srcset="imageSrcsetDefault || undefined"
              :alt="imageAlt"
              :title="imageTitle"
              class="block h-auto w-full"
              :width="imageWidth"
              :height="imageHeight"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              sizes="(max-width: 767px) 100vw, 50vw"
            >
          </picture>
          <picture v-else class="block">
            <source
              v-if="imageSrcSmall"
              :srcset="imageSrcSmall"
              media="(max-width: 767px)"
            >
            <NuxtImg
              provider="ipx"
              :src="imageSrc"
              :alt="imageAlt"
              :title="imageTitle"
              class="block h-auto w-full"
              :width="imageWidth"
              :height="imageHeight"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              sizes="(max-width: 767px) 100vw, 50vw"
              format="webp"
              :quality="80"
            />
          </picture>
          <div
            v-if="imageCreator"
            class="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-tl-md bg-black/65 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <span class="text-xs leading-none">©</span>
            <span>{{ imageCreator }}</span>
          </div>
        </div>
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
.rcg-textimage-fixed :deep(img) {
  max-height: 520px;
  width: auto;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}
</style>
