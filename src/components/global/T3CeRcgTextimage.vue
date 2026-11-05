<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed, ref, watch } from 'vue';
import Button from '~/components/basic/Button.vue';
import CarouselControls from '~/components/basic/CarouselControls.vue';
import Headline from '~/components/basic/Headline.vue';
import TextImagePicture from '~/components/basic/TextImagePicture.vue';
import {
  collectDisplayImages,
  toDisplayImage,
  type DisplayImage
} from '~/utils/media-image';
import { resolveTextImageLayout, toTextImageViews, type TextImageView } from '~/utils/textimage';

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
  layout_image?: string | null;
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
  layout_image: null,
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

const layout = computed(() => resolveTextImageLayout(props.layout_image));

const renderedImages = computed<TextImageView[]>(() => {
  const images = toTextImageViews(displayImages.value);
  return layout.value === 'single' ? images.slice(0, 1) : images;
});

const isSlideshow = computed(() => layout.value === 'slideshow' && renderedImages.value.length > 1);

// With several stacked images the image column gets tall; keep the text at the top instead of
// centering it next to the middle of the image stack.
const verticalAlignClass = computed(() => {
  return renderedImages.value.length > 1 && !isSlideshow.value ? 'xl:items-start' : 'xl:items-center';
});

// --- Slideshow ---
interface EmblaLike {
  emblaApi?: {
    scrollTo: (index: number) => void;
    scrollPrev?: () => void;
    scrollNext?: () => void;
    plugins?: () => Record<string, { stop?: () => void }>;
  };
}

// Keep the carousel options referentially stable: UCarousel re-initialises Embla (and jumps back to
// the first slide) whenever these props receive a new object.
const SLIDESHOW_UI = { item: 'basis-full' };
const SLIDESHOW_AUTOPLAY = { delay: 5000 };

const carousel = ref<EmblaLike | null>(null);
const activeIndex = ref(0);
const navigationDirection = ref<1 | -1>(1);

// All slides share the height of the tallest image (capped via max-height) to avoid jumping.
const slideshowStyle = computed(() => {
  const ratios = renderedImages.value
    .map((image) => (image.width && image.height ? image.width / image.height : null))
    .filter((ratio): ratio is number => ratio !== null);
  const ratio = ratios.length > 0 ? Math.min(...ratios) : 3 / 2;
  return { aspectRatio: String(ratio) };
});

const visibleDots = computed(() => {
  const total = renderedImages.value.length;
  if (total <= 1) return [];

  const max = Math.min(5, total);
  let start = activeIndex.value - Math.floor(max / 2);
  start = Math.max(0, start);
  start = Math.min(start, total - max);

  return Array.from({ length: max }, (_, k) => start + k);
});

const dotTransitionName = computed(() => {
  return navigationDirection.value === 1 ? 'dots-forward' : 'dots-backward';
});

const disableAutoplay = () => {
  const plugins = carousel.value?.emblaApi?.plugins?.();
  const autoplayPlugin = plugins?.autoplay ?? plugins?.Autoplay;
  autoplayPlugin?.stop?.();
};

const onSlideSelect = (index: number) => {
  const total = renderedImages.value.length;
  if (index !== activeIndex.value) {
    if (total > 1 && index === 0 && activeIndex.value === total - 1) {
      navigationDirection.value = 1;
    } else if (total > 1 && index === total - 1 && activeIndex.value === 0) {
      navigationDirection.value = -1;
    } else {
      navigationDirection.value = index > activeIndex.value ? 1 : -1;
    }
  }
  activeIndex.value = index;
};

const selectSlide = (index: number) => {
  if (index === activeIndex.value) return;
  disableAutoplay();
  navigationDirection.value = index > activeIndex.value ? 1 : -1;
  activeIndex.value = index;
  carousel.value?.emblaApi?.scrollTo(index);
};

const prevSlide = () => {
  disableAutoplay();
  navigationDirection.value = -1;
  carousel.value?.emblaApi?.scrollPrev?.();
};

const nextSlide = () => {
  disableAutoplay();
  navigationDirection.value = 1;
  carousel.value?.emblaApi?.scrollNext?.();
};

watch(() => renderedImages.value.length, (total) => {
  if (activeIndex.value >= total) {
    activeIndex.value = Math.max(0, total - 1);
  }
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
    <UContainer :class="['grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-10', verticalAlignClass]">
      <div :class="['xl:col-span-6', imageColumnClass]">
        <div v-if="isSlideshow" class="mx-auto w-full max-w-[800px]">
          <UCarousel
            ref="carousel"
            v-slot="{ item }"
            :items="renderedImages"
            :ui="SLIDESHOW_UI"
            align="start"
            loop
            :autoplay="SLIDESHOW_AUTOPLAY"
            @pointerdown="disableAutoplay"
            @touchstart="disableAutoplay"
            @select="onSlideSelect"
          >
            <div class="flex max-h-[520px] w-full items-center justify-center" :style="slideshowStyle">
              <div :class="['h-full', item.slideClass]">
                <TextImagePicture :image="item" fill/>
              </div>
            </div>
          </UCarousel>
          <CarouselControls
            class="mt-4"
            mode="inline"
            :visible-dots="visibleDots"
            :active-index="activeIndex"
            :animate-dots="true"
            :transition-name="dotTransitionName"
            @prev="prevSlide"
            @next="nextSlide"
            @select="selectSlide"
          />
        </div>
        <div
          v-else-if="renderedImages.length > 0"
          class="mx-auto grid w-full max-w-[800px] grid-cols-2 items-center gap-4 sm:grid-cols-6"
        >
          <div
            v-for="(renderedImage, index) in renderedImages"
            :key="`${renderedImage.src}-${index}`"
            :class="['min-w-0', renderedImage.cellClass]"
          >
            <TextImagePicture :image="renderedImage"/>
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
