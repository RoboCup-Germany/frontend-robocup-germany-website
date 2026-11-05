<script setup lang="ts">
import { NuxtImg } from '#components';
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';
import {
  collectDisplayImages,
  toDisplayImage,
  type DisplayImage,
  type DisplayImageSize
} from '~/utils/media-image';

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

const displayImages = computed<DisplayImage[]>(() => {
  const fromImageList = collectDisplayImages(normalizedImageList.value);
  if (fromImageList.length > 0) {
    return fromImageList;
  }

  const fromMediaList = collectDisplayImages(normalizedMediaList.value);
  if (fromMediaList.length > 0) {
    return fromMediaList;
  }

  if (normalizedMediaRecord.value) {
    const parsed = toDisplayImage(normalizedMediaRecord.value);
    if (parsed) {
      return [parsed];
    }
  }

  return [];
});

type ImageSizeLayout = {
  cellClass: string;
  imageClass: string;
  sizes: string;
  nuxtSizes: string;
};

// The image area is at most 800px wide (one column of the 12-column grid from xl on, ~600px).
// Within it, a 6-column grid places the images: large = full width, medium = 1/2, small = 1/3.
// Below sm the grid has 2 columns: large and medium take the full width, small takes half.
// The backend caps the delivered resolution per size accordingly (2x of the largest slot).
const IMAGE_SIZE_LAYOUTS: Record<DisplayImageSize, ImageSizeLayout> = {
  large: {
    cellClass: 'col-span-2 sm:col-span-6',
    imageClass: 'max-h-[520px]',
    sizes: '(min-width: 1280px) 600px, (min-width: 864px) 800px, 100vw',
    nuxtSizes: 'xs:100vw md:800px xl:600px'
  },
  medium: {
    cellClass: 'col-span-2 sm:col-span-3',
    imageClass: 'max-h-[360px]',
    sizes: '(min-width: 1280px) 300px, (min-width: 864px) 400px, (min-width: 640px) 50vw, 100vw',
    nuxtSizes: 'xs:100vw sm:50vw md:400px xl:300px'
  },
  small: {
    cellClass: 'col-span-1 sm:col-span-2',
    imageClass: 'max-h-[240px]',
    sizes: '(min-width: 1280px) 200px, (min-width: 864px) 270px, (min-width: 640px) 33vw, 50vw',
    nuxtSizes: 'xs:50vw sm:33vw md:270px xl:200px'
  }
};

const toPositiveOrUndefined = (value?: number | null): number | undefined => {
  return value && value > 0 ? value : undefined;
};

const renderedImages = computed(() => {
  return displayImages.value
    .map((image) => {
      const srcDefault = image.urlDefault || null;
      const srcSmall = image.urlSmall || null;
      const src = srcDefault || srcSmall;

      if (!src) {
        return null;
      }

      const layout = IMAGE_SIZE_LAYOUTS[image.imageSize ?? 'large'];

      return {
        src,
        srcSmall,
        srcsetDefault: image.srcsetDefault || null,
        srcsetSmall: image.srcsetSmall || null,
        alt: image.alt ?? '',
        title: image.title ?? '',
        creator: (image.creator ?? '').trim(),
        width: toPositiveOrUndefined(image.width),
        height: toPositiveOrUndefined(image.height),
        ...layout
      };
    })
    .filter((image): image is NonNullable<typeof image> => Boolean(image));
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
        <div
          v-if="renderedImages.length > 0"
          class="mx-auto grid w-full max-w-[800px] grid-cols-2 items-center gap-4 sm:grid-cols-6"
        >
          <div
            v-for="(renderedImage, index) in renderedImages"
            :key="`${renderedImage.src}-${index}`"
            :class="['min-w-0', renderedImage.cellClass]"
          >
            <div class="group relative w-full overflow-hidden">
              <picture v-if="renderedImage.srcsetDefault || renderedImage.srcsetSmall" class="block">
                <source
                  v-if="renderedImage.srcsetSmall"
                  :srcset="renderedImage.srcsetSmall"
                  media="(max-width: 767px)"
                  :sizes="renderedImage.sizes"
                >
                <source
                  v-if="renderedImage.srcsetDefault"
                  :srcset="renderedImage.srcsetDefault"
                  media="(min-width: 768px)"
                  :sizes="renderedImage.sizes"
                >
                <img
                  :src="renderedImage.src"
                  :srcset="renderedImage.srcsetDefault || undefined"
                  :alt="renderedImage.alt"
                  :title="renderedImage.title"
                  :class="['rcg-textimage-image block h-auto w-full object-contain', renderedImage.imageClass]"
                  :width="renderedImage.width"
                  :height="renderedImage.height"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  :sizes="renderedImage.sizes"
                >
              </picture>
              <picture v-else class="block">
                <source
                  v-if="renderedImage.srcSmall"
                  :srcset="renderedImage.srcSmall"
                  media="(max-width: 767px)"
                >
                <NuxtImg
                  provider="ipx"
                  :src="renderedImage.src"
                  :alt="renderedImage.alt"
                  :title="renderedImage.title"
                  :class="['rcg-textimage-image block h-auto w-full object-contain', renderedImage.imageClass]"
                  :width="renderedImage.width"
                  :height="renderedImage.height"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  :sizes="renderedImage.nuxtSizes"
                  format="webp"
                  :quality="80"
                />
              </picture>
              <div
                v-if="renderedImage.creator"
                class="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-tl-md bg-black/65 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <span class="text-xs leading-none">©</span>
                <span>{{ renderedImage.creator }}</span>
              </div>
            </div>
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
