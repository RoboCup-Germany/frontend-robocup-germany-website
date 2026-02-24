<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed, nextTick, onMounted, onUnmounted, ref, type Ref, useAttrs, watch } from 'vue'
import CarouselControls from '~/components/basic/CarouselControls.vue'
import { extractArrayFromUnknown, findImageLikeDeep, parseMaybeJson, toDisplayImage, type DisplayImage } from '~/utils/media-image'

defineOptions({ inheritAttrs: false })

interface ThemeGalleryBlockAppearance {
  layout?: string
  galleryType?: string
  frameClass?: string
  spaceBefore?: string
  spaceAfter?: string
}

interface ThemeGalleryBlock {
  uid?: number
  appearance?: ThemeGalleryBlockAppearance
  index?: number
  id?: number | null
  frame_class?: string
  gallery_type?: number
  gallery?: MediaRef[]
  layout?: number
  space_after_class?: string
  space_before_class?: string
}

interface T3CeRcgGallery extends T3CeBaseProps {
  images?: MediaRef[] | string | null
  gallery?: MediaRef[] | string | null
  media?: MediaRef[] | string | null
  block?: ThemeGalleryBlock | string | null
  layout?: number | string | null
  gallery_layout?: number | string | null
  gallery_type?: number | string | null
}

interface GalleryImageView {
  id: string
  srcMobile: string
  srcDesktop: string
  alt: string
  title: string
}

const props = withDefaults(defineProps<T3CeRcgGallery>(), {})
const attrs = useAttrs()

// Extract block (if provided as object or JSON string)
const blockObj = computed<ThemeGalleryBlock | null>(() => {
  const maybe = parseMaybeJson(props.block ?? null)
  if (maybe && typeof maybe === 'object') return maybe as ThemeGalleryBlock
  return null
})

// Normalize to an array of unknown items.
// Priority: gallery → images → media → block.gallery → block/media objects
const parsedImages = computed<unknown[]>(() => {
  // Start empty and fill from first non-empty source to avoid masking fallbacks with empty arrays
  let out: unknown[] = []

  if (props.gallery != null) {
    out = extractArrayFromUnknown(props.gallery)
  }

  if (out.length === 0 && props.images != null) {
    out = extractArrayFromUnknown(props.images)
  }

  if (out.length === 0 && props.media != null) {
    out = extractArrayFromUnknown(props.media)
  }

  if (out.length === 0) {
    const b = blockObj.value
    if (b) {
      if (Array.isArray(b.gallery)) out = b.gallery as unknown[]
      else out = extractArrayFromUnknown(b as unknown)
    }
  }

  if (out.length === 0 && attrs && typeof attrs === 'object') {
    const rawAttrs = attrs as Record<string, unknown>
    const candidates = ['gallery', 'images', 'media', 'items', 'data', 'block']
    for (const key of candidates) {
      if (out.length > 0) break
      out = extractArrayFromUnknown(rawAttrs[key])
    }
    // Fallback: attributes themselves may already be a single image-like object
    // (e.g. { uid, url, cropVariants, ... } from TYPO3 CE payload)
    if (out.length === 0) {
      out = extractArrayFromUnknown(rawAttrs)
    }
  }

  if (out.length === 0) {
    out = findImageLikeDeep({
      props: props as unknown,
      attrs: attrs as unknown,
      block: blockObj.value as unknown
    })
  }

  return out
})

const normalizedImages = computed<DisplayImage[]>(() => parsedImages.value
  .map(toDisplayImage)
  .filter((v): v is DisplayImage => !!v))

const galleryImages = computed<GalleryImageView[]>(() => normalizedImages.value
  .map((item, index) => {
    const srcDesktop = item.urlDefault || item.urlSmall || ''
    const srcMobile = item.urlSmall || item.urlDefault || ''
    if (!srcDesktop && !srcMobile) return null
    return {
      id: srcDesktop || srcMobile || String(index),
      srcMobile,
      srcDesktop,
      alt: item.alt || '',
      title: item.title || ''
    } satisfies GalleryImageView
  })
  .filter((item): item is GalleryImageView => Boolean(item)))

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

const galleryLayout = computed(() => {
  const b = blockObj.value
  const blockContent = (b as { content?: Record<string, unknown> } | null)?.content
  const value = props.gallery_layout
    ?? props.layout
    ?? attrs.gallery_layout
    ?? attrs.layout
    ?? blockContent?.gallery_layout
    ?? blockContent?.layout
    ?? b?.layout
    ?? b?.appearance?.layout
  return toPositiveInt(value, 0)
})

const isGridLayout = computed(() => galleryLayout.value === 1)
const galleryType = computed(() => {
  const b = blockObj.value
  const blockContent = (b as { content?: Record<string, unknown> } | null)?.content
  const value = props.gallery_type
    ?? attrs.gallery_type
    ?? blockContent?.gallery_type
    ?? b?.gallery_type
    ?? b?.appearance?.galleryType
  return toPositiveInt(value, 0)
})
const isSpaciousGallery = computed(() => galleryType.value === 1)
const isChunkedCarouselLayout = computed(() => galleryLayout.value === 0 && isSpaciousGallery.value)
const gridWrapperClass = computed(() => (
  isSpaciousGallery.value
    ? 'w-full columns-1 gap-10 px-2 py-4 md:columns-2 lg:columns-3'
    : 'w-full columns-1 gap-4 px-2 py-4 md:columns-2 lg:columns-3'
))
const gridItemClass = computed(() => (
  isSpaciousGallery.value
    ? 'mb-10 w-full break-inside-avoid overflow-hidden rounded bg-white'
    : 'mb-4 w-full break-inside-avoid overflow-hidden rounded bg-white'
))


// --- Carousel control / active index (für Custom-Dots) ---
interface EmblaLike {
  emblaApi?: {
    scrollTo: (index: number) => void
    scrollPrev?: () => void
    scrollNext?: () => void
    canScrollPrev?: () => boolean
    canScrollNext?: () => boolean
    selectedScrollSnap?: () => number
    plugins?: () => Record<string, { stop?: () => void }>
  }
}
const carousel: Ref<EmblaLike | null> = ref(null)
const activeIndex = ref(0)
const navigationDirection = ref<1 | -1>(1)

function disableAutoplay() {
  const plugins = carousel.value?.emblaApi?.plugins?.()
  const autoplayPlugin = plugins?.autoplay ?? plugins?.Autoplay
  autoplayPlugin?.stop?.()
}

function onSelect(index: number) {
  const total = galleryImages.value.length
  if (index !== activeIndex.value) {
    if (total > 1 && index === 0 && activeIndex.value === total - 1) {
      navigationDirection.value = 1
    } else if (total > 1 && index === total - 1 && activeIndex.value === 0) {
      navigationDirection.value = -1
    } else {
      navigationDirection.value = index > activeIndex.value ? 1 : -1
    }
  }
  activeIndex.value = index
}

function select(index: number) {
  if (index === activeIndex.value) return
  disableAutoplay()
  navigationDirection.value = index > activeIndex.value ? 1 : -1
  activeIndex.value = index
  carousel.value?.emblaApi?.scrollTo(index)
}

function prev() {
  disableAutoplay()
  navigationDirection.value = -1
  carousel.value?.emblaApi?.scrollPrev?.()
}

function next() {
  disableAutoplay()
  navigationDirection.value = 1
  carousel.value?.emblaApi?.scrollNext?.()
}

const DESKTOP_BREAKPOINT = 992
const selectedChunkIndex = ref(0)
const canScrollChunkPrev = ref(false)
const canScrollChunkNext = ref(false)
const cardsPerView = computed(() => {
  if (!isChunkedCarouselLayout.value) return 1
  if (viewportWidth.value >= DESKTOP_BREAKPOINT) return 4
  if (viewportWidth.value >= MOBILE_BREAKPOINT) return 2
  return 1
})
const galleryImageChunks = computed<GalleryImageView[][]>(() => {
  if (!isChunkedCarouselLayout.value) return []
  const size = cardsPerView.value
  if (size < 1 || galleryImages.value.length === 0) return []

  const chunks: GalleryImageView[][] = []
  for (let i = 0; i < galleryImages.value.length; i += size) {
    chunks.push(galleryImages.value.slice(i, i + size))
  }
  return chunks
})

const updateChunkCarouselState = () => {
  if (!isChunkedCarouselLayout.value) {
    canScrollChunkPrev.value = false
    canScrollChunkNext.value = false
    selectedChunkIndex.value = 0
    return
  }

  const api = carousel.value?.emblaApi
  if (!api) {
    canScrollChunkPrev.value = false
    canScrollChunkNext.value = false
    return
  }

  canScrollChunkPrev.value = Boolean(api.canScrollPrev?.())
  canScrollChunkNext.value = Boolean(api.canScrollNext?.())
  selectedChunkIndex.value = api.selectedScrollSnap?.() ?? 0
}

function onChunkSelect() {
  updateChunkCarouselState()
}

function prevChunk() {
  const api = carousel.value?.emblaApi
  if (!api || selectedChunkIndex.value <= 0) return

  disableAutoplay()
  api.scrollTo(Math.max(0, selectedChunkIndex.value - 1))
  updateChunkCarouselState()
}

function nextChunk() {
  const api = carousel.value?.emblaApi
  if (!api || selectedChunkIndex.value >= Math.max(0, galleryImageChunks.value.length - 1)) return

  disableAutoplay()
  api.scrollTo(Math.min(galleryImageChunks.value.length - 1, selectedChunkIndex.value + 1))
  updateChunkCarouselState()
}

const hasChunkPrev = computed(() => selectedChunkIndex.value > 0 || canScrollChunkPrev.value)
const hasChunkNext = computed(() => selectedChunkIndex.value < Math.max(0, galleryImageChunks.value.length - 1) || canScrollChunkNext.value)

// --- max. 5 Dots sichtbar, Window um activeIndex zentriert ---
const visibleDots = computed(() => {
  const total = galleryImages.value.length
  if (total <= 1) return []

  const max = Math.min(5, total)
  let start = activeIndex.value - Math.floor(max / 2)

  start = Math.max(0, start)
  start = Math.min(start, total - max)

  return Array.from({ length: max }, (_, k) => start + k)
})

const dotTransitionName = computed(() => {
  return navigationDirection.value === 1 ? 'dots-forward' : 'dots-backward'
})

const carouselUi = computed(() => ({
  item: 'basis-full',
  container: 'justify-around'
}))

const GALLERY_MAX_HEIGHT = 640
const MOBILE_BREAKPOINT = 768
const galleryImageHeight = ref<number>(GALLERY_MAX_HEIGHT)
const viewportWidth = ref(MOBILE_BREAKPOINT)
let heightRequestId = 0

const updateViewportWidth = () => {
  if (!import.meta.client) return
  viewportWidth.value = window.innerWidth || MOBILE_BREAKPOINT
}

const isMobileViewport = computed(() => {
  if (!import.meta.client) return false
  return viewportWidth.value < MOBILE_BREAKPOINT
})

const galleryHeightStyle = computed<Record<string, string>>(() => {
  if (isGridLayout.value) return {}
  if (isChunkedCarouselLayout.value) return {}
  if (isMobileViewport.value) return {}
  return { height: `${galleryImageHeight.value}px` }
})

const preloadCache = new Set<string>()

const preloadImage = (url: string) => {
  if (!import.meta.client || !url || preloadCache.has(url)) return
  preloadCache.add(url)
  const img = new Image()
  img.decoding = 'async'
  img.src = url
}

const preloadAroundActive = () => {
  if (!import.meta.client || galleryImages.value.length === 0) return

  const total = galleryImages.value.length
  const indices = [
    activeIndex.value,
    (activeIndex.value + 1) % total,
    (activeIndex.value - 1 + total) % total
  ]

  for (const index of indices) {
    const image = galleryImages.value[index]
    if (!image) continue
    preloadImage(image.srcMobile)
    preloadImage(image.srcDesktop)
  }
}

const loadImageNaturalHeight = (url: string): Promise<number | null> => {
  if (!import.meta.client || !url) return Promise.resolve(null)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalHeight > 0 ? img.naturalHeight : null)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

const refreshGalleryImageHeight = async () => {
  if (!import.meta.client) return

  const urls = Array.from(new Set(galleryImages.value.map((item) => item.srcDesktop).filter(Boolean)))

  if (urls.length === 0) {
    galleryImageHeight.value = GALLERY_MAX_HEIGHT
    return
  }

  const requestId = ++heightRequestId
  const heights = await Promise.all(urls.map((url) => loadImageNaturalHeight(url)))

  if (requestId !== heightRequestId) return

  const validHeights = heights.filter((height): height is number => typeof height === 'number' && height > 0)

  if (validHeights.length === 0) {
    galleryImageHeight.value = GALLERY_MAX_HEIGHT
    return
  }

  galleryImageHeight.value = Math.min(Math.min(...validHeights), GALLERY_MAX_HEIGHT)
}

watch(galleryImages, () => {
  if (activeIndex.value >= galleryImages.value.length) {
    activeIndex.value = Math.max(0, galleryImages.value.length - 1)
  }
  void refreshGalleryImageHeight()
  preloadAroundActive()
}, { immediate: true })

watch(activeIndex, () => {
  preloadAroundActive()
})

watch(
  () => [galleryImageChunks.value.length, cardsPerView.value, isChunkedCarouselLayout.value],
  async () => {
    if (!isChunkedCarouselLayout.value) return

    await nextTick()
    carousel.value?.emblaApi?.scrollTo(0)
    updateChunkCarouselState()
  }
)

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
  void refreshGalleryImageHeight()
  void nextTick(() => {
    updateChunkCarouselState()
  })
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('resize', updateViewportWidth)
})

// Compute optional spacing/frame classes from block appearance
const sectionClasses = computed(() => {
  const b = blockObj.value
  const classes: string[] = ['w-full']

  const before = b?.appearance?.spaceBefore || b?.space_before_class
  const after = b?.appearance?.spaceAfter || b?.space_after_class
  const frame = b?.appearance?.frameClass || b?.frame_class

  if (frame) classes.push(frame)
  if (before) classes.push(before)
  if (after) classes.push(after)

  return classes.join(' ')
})
</script>

<template>
  <section :class="sectionClasses">
    <UContainer>
      <div v-if="isGridLayout" :class="gridWrapperClass">
        <div
          v-for="image in galleryImages"
          :key="image.id"
          :class="gridItemClass"
          :style="galleryHeightStyle"
        >
          <picture class="block w-full">
            <source :srcset="image.srcDesktop" media="(min-width: 1024px)">
            <img
              :src="image.srcMobile"
              :alt="image.alt"
              :title="image.title"
              class="rcg-image block h-auto w-full object-cover"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              draggable="false"
            >
          </picture>
        </div>
      </div>

      <div v-else-if="isChunkedCarouselLayout" class="relative w-full px-2 py-4 md:px-0">
        <button
          type="button"
          class="absolute top-1/2 left-2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-[0_10px_28px_rgba(0,96,255,0.2)] transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:left-0 md:-translate-x-1/2"
          aria-label="Vorherige Bilder"
          :disabled="!hasChunkPrev"
          @click="prevChunk"
        >
          <svg viewBox="0 0 1080 1080" class="h-4 w-4 rotate-90" fill="none" aria-hidden="true">
            <polyline
              points="841.93 389.03 540 690.97 238.07 389.03"
              stroke="currentColor"
              stroke-width="110"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          class="absolute top-1/2 right-2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-[0_10px_28px_rgba(0,96,255,0.2)] transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:right-0 md:translate-x-1/2"
          aria-label="Nächste Bilder"
          :disabled="!hasChunkNext"
          @click="nextChunk"
        >
          <svg viewBox="0 0 1080 1080" class="h-4 w-4 -rotate-90" fill="none" aria-hidden="true">
            <polyline
              points="841.93 389.03 540 690.97 238.07 389.03"
              stroke="currentColor"
              stroke-width="110"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <UCarousel
          ref="carousel"
          :key="`gallery-chunks-${cardsPerView}`"
          v-slot="{ item: chunk }"
          :items="galleryImageChunks"
          :ui="carouselUi"
          :loop="false"
          align="start"
          autoplay
          class="relative z-10"
          @pointerdown="disableAutoplay"
          @touchstart="disableAutoplay"
          @select="onChunkSelect"
        >
          <ul class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <li
              v-for="image in chunk"
              :key="image.id"
              class="overflow-hidden rounded bg-white"
            >
              <picture class="block w-full">
                <source :srcset="image.srcDesktop" media="(min-width: 1024px)">
                <img
                  :src="image.srcMobile"
                  :alt="image.alt"
                  :title="image.title"
                  class="rcg-image block aspect-[4/3] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  draggable="false"
                >
              </picture>
            </li>
          </ul>
        </UCarousel>
      </div>

      <!-- relative => Overlay kann am unteren Rand "kleben" -->
      <div v-else class="relative w-full">
        <UCarousel
          ref="carousel"
          v-slot="{ item }"
          :items="galleryImages"
          :ui="carouselUi"
          align="start"
          autoplay
          class="relative z-10"
          @pointerdown="disableAutoplay"
          @touchstart="disableAutoplay"
          @select="onSelect"
        >
          <div class="rcg-slide-media flex w-full items-center justify-center overflow-hidden bg-white" :style="galleryHeightStyle">
            <picture class="block h-full w-full md:w-auto">
              <source :srcset="item.srcDesktop" media="(min-width: 1024px)">
              <img
                :src="item.srcMobile"
                :alt="item.alt"
                :title="item.title"
                class="rcg-image mx-auto block h-auto w-full object-contain md:h-full md:w-auto md:max-w-none md:object-cover"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                draggable="false"
              >
            </picture>
          </div>
        </UCarousel>

        <CarouselControls
          :visible-dots="visibleDots"
          :active-index="activeIndex"
          :show-arrows="galleryImages.length > 1"
          :animate-dots="true"
          :transition-name="dotTransitionName"
          @prev="prev"
          @next="next"
          @select="select"
        />
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.rcg-slide-media {
  transform: translateZ(0);
  will-change: transform;
}

.rcg-image {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
</style>
