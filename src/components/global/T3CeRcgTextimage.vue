<script setup lang="ts">
import { NuxtImg } from '#components';
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';
import CarouselControls from '~/components/basic/CarouselControls.vue';
import Headline from '~/components/basic/Headline.vue';
import { pickFirstDisplayImage, toDisplayImage, type DisplayImage } from '~/utils/media-image';
import { vLightbox } from '~/directives/lightbox';

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
  subheader?: string;
  bodytext?: string;
  button_text?: string;
  color_select?: ContentButton['color_select'];
  button_link?: LinkRef | null;
  button_size?: 'small' | 'medium' | 'large';
  button_type?: ContentButton['button_type'];
  buttons?: ContentButton[];
  orientation?: 'left' | 'right';
  layout_image?: 'single' | 'multi' | 'slideshow';
  image?: unknown;
  media?: unknown;
}

interface GalleryImageView {
  id: string;
  srcMobile: string;
  srcDesktop: string;
  alt: string;
  title: string;
  creator: string;
  width?: number;
  height?: number;
}

interface EmblaLike {
  emblaApi?: {
    scrollTo: (index: number) => void;
    scrollPrev?: () => void;
    scrollNext?: () => void;
    plugins?: () => Record<string, { stop?: () => void }>;
  };
}

const props = withDefaults(defineProps<T3CeRcgTextimage>(), {
  header: '',
  header_layout: 2,
  subheader: undefined,
  bodytext: '',
  button_text: '',
  color_select: 'primary',
  button_link: null,
  button_size: 'medium',
  button_type: 'full',
  buttons: () => [],
  orientation: 'left',
  layout_image: 'single',
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

const rawMediaArray = computed<unknown[]>(() => {
  if (normalizedMediaList.value.length > 0) return normalizedMediaList.value;
  if (normalizedImageList.value.length > 0) return normalizedImageList.value;
  if (normalizedMediaRecord.value) return [normalizedMediaRecord.value];
  return [];
});

const displayImage = computed<DisplayImage | null>(() => {
  if (normalizedMediaList.value.length > 0) {
    return pickFirstDisplayImage(normalizedMediaList.value) || pickFirstDisplayImage(normalizedImageList.value);
  }

  if (normalizedMediaRecord.value) {
    const parsed = toDisplayImage(normalizedMediaRecord.value);
    if (parsed) return parsed;
  }

  return pickFirstDisplayImage(normalizedImageList.value);
});

const imageSrcDefault = computed(() => displayImage.value?.urlDefault || null);
const imageSrcSmall = computed(() => displayImage.value?.urlSmall || null);
const imageSrc = computed(() => imageSrcDefault.value || imageSrcSmall.value || null);
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

const galleryImages = computed<GalleryImageView[]>(() => {
  return rawMediaArray.value
    .map(toDisplayImage)
    .filter((v): v is DisplayImage => !!v)
    .map((item, index) => {
      const srcDesktop = item.urlDefault || item.urlSmall || '';
      const srcMobile = item.urlSmall || item.urlDefault || '';
      if (!srcDesktop && !srcMobile) return null;
      const width = item.width && item.width > 0 ? item.width : undefined;
      const height = item.height && item.height > 0 ? item.height : undefined;

      return {
        id: srcDesktop || srcMobile || String(index),
        srcMobile,
        srcDesktop,
        alt: item.alt || '',
        title: item.title || '',
        creator: (item.creator ?? '').trim(),
        width,
        height
      } satisfies GalleryImageView;
    })
    .filter((item): item is GalleryImageView => Boolean(item));
});

const carousel = ref<EmblaLike | null>(null);
const activeIndex = ref(0);
const navigationDirection = ref<1 | -1>(1);

function disableAutoplay() {
  const plugins = carousel.value?.emblaApi?.plugins?.();
  const autoplayPlugin = plugins?.autoplay ?? plugins?.Autoplay;
  autoplayPlugin?.stop?.();
}

function onSelect(index: number) {
  const total = galleryImages.value.length;
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
}

function select(index: number) {
  if (index === activeIndex.value) return;
  disableAutoplay();
  navigationDirection.value = index > activeIndex.value ? 1 : -1;
  activeIndex.value = index;
  carousel.value?.emblaApi?.scrollTo(index);
}

function prev() {
  disableAutoplay();
  navigationDirection.value = -1;
  carousel.value?.emblaApi?.scrollPrev?.();
}

function next() {
  disableAutoplay();
  navigationDirection.value = 1;
  carousel.value?.emblaApi?.scrollNext?.();
}

const visibleDots = computed(() => {
  const total = galleryImages.value.length;
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

const MIN_COLUMNS_MOBILE = 2;
const MIN_COLUMNS_TABLET = 3;
const MIN_COLUMNS_DESKTOP = 3;
const MAX_COLUMNS = 6;

function getBaseColumns(width: number): number {
  if (width >= 1280) return MIN_COLUMNS_DESKTOP;
  if (width >= 768) return MIN_COLUMNS_TABLET;
  return MIN_COLUMNS_MOBILE;
}

const textColumnRef = ref<HTMLElement | null>(null);
const wallInnerRef = ref<HTMLElement | null>(null);

const textColumnHeight = ref<number | null>(null);
const wallNaturalHeight = ref<number | null>(null);
const wallColumns = ref(MIN_COLUMNS_MOBILE);

const containerWidth = ref(0);

const GAP_MOBILE_PX = 12;
const GAP_TABLET_PX = 16;
const GAP_DESKTOP_PX = 12;
const WIDE_ASPECT_RATIO_THRESHOLD = 1.45;

function getGapPx(width: number): number {
  if (width >= 1280) return GAP_DESKTOP_PX;
  if (width >= 768) return GAP_TABLET_PX;
  return GAP_MOBILE_PX;
}

const gapPx = ref(GAP_MOBILE_PX);

const wallScale = computed(() => {
  if (!textColumnHeight.value || !wallNaturalHeight.value) return 1;
  if (wallNaturalHeight.value <= textColumnHeight.value) return 1;
  return textColumnHeight.value / wallNaturalHeight.value;
});

const wallWrapperStyle = computed(() => {
  if (!textColumnHeight.value || !wallNaturalHeight.value) {
    return {};
  }
  const visibleHeight = Math.min(textColumnHeight.value, wallNaturalHeight.value * wallScale.value);
  return { height: `${visibleHeight}px` };
});

const wallInnerStyle = computed(() => {
  const style: Record<string, string> = {
    gridTemplateColumns: `repeat(${Math.max(1, wallColumns.value)}, 1fr)`,
    '--wall-gap': `${gapPx.value}px`
  };
  if (wallScale.value < 1) {
    style.transform = `scale(${wallScale.value})`;
    style.transformOrigin = 'top center';
  }
  return style;
});

interface MasonryItem {
  item: GalleryImageView;
  colSpan: number;
  rowSpan: number;
  heightPx: number;
}

const masonryItems = computed<MasonryItem[]>(() => {
  const columns = Math.max(1, wallColumns.value);
  const gap = gapPx.value;
  const width = containerWidth.value;

  if (!width) {
    return galleryImages.value.map((item) => ({ item, colSpan: 1, rowSpan: 1, heightPx: 200 }));
  }

  const columnWidth = (width - gap * (columns - 1)) / columns;

  return galleryImages.value.map((item) => {
    const aspectRatio = item.width && item.height ? item.width / item.height : 4 / 3;
    const colSpan = aspectRatio >= WIDE_ASPECT_RATIO_THRESHOLD && columns >= 3 ? 2 : 1;
    const itemWidth = colSpan * columnWidth + (colSpan - 1) * gap;
    const heightPx = Math.max(1, itemWidth / aspectRatio);
    const rowSpan = Math.round(heightPx + gap);
    return { item, colSpan, rowSpan, heightPx };
  });
});

let textResizeObserver: ResizeObserver | null = null;
let wallResizeObserver: ResizeObserver | null = null;
let resizeHandler: (() => void) | null = null;

function resetColumnsForViewport() {
  if (typeof window === 'undefined') return;
  wallColumns.value = getBaseColumns(window.innerWidth);
  gapPx.value = getGapPx(window.innerWidth);
}

watch([textColumnHeight, wallNaturalHeight], () => {
  if (!textColumnHeight.value || !wallNaturalHeight.value) return;
  if (wallNaturalHeight.value > textColumnHeight.value && wallColumns.value < MAX_COLUMNS) {
    wallColumns.value += 1;
  }
});

watch(galleryImages, resetColumnsForViewport);

onMounted(() => {
  if (typeof window === 'undefined') return;

  resetColumnsForViewport();
  resizeHandler = () => resetColumnsForViewport();
  window.addEventListener('resize', resizeHandler, { passive: true });

  if (textColumnRef.value) {
    textResizeObserver = new ResizeObserver((entries) => {
      textColumnHeight.value = entries[0]?.contentRect.height ?? null;
    });
    textResizeObserver.observe(textColumnRef.value);
  }

  if (wallInnerRef.value) {
    wallResizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      wallNaturalHeight.value = rect?.height ?? null;
      containerWidth.value = rect?.width ?? 0;
    });
    wallResizeObserver.observe(wallInnerRef.value);
  }
});

onBeforeUnmount(() => {
  textResizeObserver?.disconnect();
  wallResizeObserver?.disconnect();
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }
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
      <div :class="['xl:col-span-6 w-full min-w-0 overflow-hidden', imageColumnClass]">
        <template v-if="props.layout_image === 'single' || !props.layout_image">
          <div v-if="imageSrc" class="rcg-textimage-fixed relative group overflow-hidden">
            <picture class="block">
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
                sizes="100vw lg:1200px"
                format="webp"
                :quality="80"
                v-lightbox="{ src: imageSrc, alt: imageAlt, width: imageWidth, height: imageHeight }"
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
        </template>
        <template v-else-if="props.layout_image === 'slideshow'">
          <div v-if="galleryImages.length > 0" class="relative w-full overflow-hidden">
            <UCarousel
              ref="carousel"
              v-slot="{ item }"
              :items="galleryImages"
              :ui="{ item: 'basis-full min-w-0 shrink-0 grow-0', container: 'flex' }"
              align="start"
              autoplay
              class="relative z-10 w-full overflow-hidden"
              @pointerdown="disableAutoplay"
              @touchstart="disableAutoplay"
              @select="onSelect"
            >
              <div class="rcg-slide-media flex h-[350px] md:h-[500px] w-full items-center justify-center overflow-hidden">
                <picture class="flex items-center justify-center w-full h-full">
                  <source :srcset="item.srcDesktop" media="(min-width: 1024px)">
                  <img
                    :src="item.srcMobile"
                    :alt="item.alt"
                    :title="item.title"
                    class="rcg-image max-w-full max-h-full w-auto h-auto object-contain mx-auto"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                    draggable="false"
                    v-lightbox="{ src: item.srcDesktop || item.srcMobile, alt: item.alt, width: item.width, height: item.height }"
                  >
                </picture>
              </div>
            </UCarousel>

            <CarouselControls
              v-if="galleryImages.length > 1"
              :visible-dots="visibleDots"
              :active-index="activeIndex"
              :show-arrows="galleryImages.length > 1"
              :animate-dots="true"
              :transition-name="dotTransitionName"
              class="mt-4"
              @prev="prev"
              @next="next"
              @select="select"
            />
          </div>
        </template>
        <template v-else-if="props.layout_image === 'multi'">
          <div
            v-if="galleryImages.length > 0"
            class="rcg-multi-wall-wrapper"
            :style="wallWrapperStyle"
          >
            <div ref="wallInnerRef" class="rcg-multi-wall" :style="wallInnerStyle">
              <figure
                v-for="entry in masonryItems"
                :key="entry.item.id"
                class="rcg-multi-wall-item group relative overflow-hidden rounded-lg"
                :style="{ gridColumn: `span ${entry.colSpan}`, gridRowEnd: `span ${entry.rowSpan}`, height: `${entry.heightPx}px` }"
              >
                <NuxtImg
                  provider="ipx"
                  :src="entry.item.srcDesktop || entry.item.srcMobile"
                  :alt="entry.item.alt"
                  :title="entry.item.title"
                  class="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  :width="entry.item.width"
                  :height="entry.item.height"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  sizes="50vw md:33vw xl:17vw"
                  format="webp"
                  :quality="80"
                  v-lightbox="{ src: entry.item.srcDesktop || entry.item.srcMobile, alt: entry.item.alt, width: entry.item.width, height: entry.item.height }"
                />
                <figcaption
                  v-if="entry.item.creator"
                  class="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-tl-md bg-black/65 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  <span class="leading-none">©</span>
                  <span>{{ entry.item.creator }}</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </template>
      </div>
      <div ref="textColumnRef" :class="['xl:col-span-6', textColumnClass]">
        <SectionHeader :header="header" :subheader="subheader" subheader-class="mb-4 text-base italic uppercase tracking-wide text-black font-semibold"/>
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
.rcg-textimage-slideshow {
  overflow: hidden;
}

.rcg-textimage-fixed :deep(img) {
  max-height: 520px;
  width: auto;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.rcg-slide-media {
  transform: translateZ(0);
  will-change: transform;
}

.rcg-image {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.rcg-multi-wall-wrapper {
  overflow: hidden;
}

.rcg-multi-wall-wrapper > .rcg-multi-wall {
  transition: transform 0.2s ease-out;
}

.rcg-multi-wall {
  display: grid;
  grid-auto-rows: 1px;
  grid-auto-flow: dense;
  column-gap: var(--wall-gap, 0.75rem);
  row-gap: 0;
}

.rcg-multi-wall-item :deep(img) {
  height: 100%;
  width: 100%;
}
</style>