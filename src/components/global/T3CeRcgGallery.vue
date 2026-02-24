<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed, onMounted, ref, type Ref, useAttrs, watch } from 'vue'
import CarouselControls from '~/components/basic/CarouselControls.vue'
import { extractArrayFromUnknown, findImageLikeDeep, parseMaybeJson, toDisplayImage, type DisplayImage } from '~/utils/media-image'

defineOptions({ inheritAttrs: false })

interface ThemeGalleryBlockAppearance {
  layout?: string
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

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

const galleryLayout = computed(() => {
  const b = blockObj.value
  const value = props.gallery_layout
    ?? props.layout
    ?? attrs.gallery_layout
    ?? attrs.layout
    ?? b?.layout
    ?? b?.appearance?.layout
  return toPositiveInt(value, 0)
})

const isGridLayout = computed(() => galleryLayout.value === 1)


// --- Carousel control / active index (für Custom-Dots) ---
interface EmblaLike {
  emblaApi?: {
    scrollTo: (index: number) => void
    scrollPrev?: () => void
    scrollNext?: () => void
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
  const total = normalizedImages.value.length
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

// --- max. 5 Dots sichtbar, Window um activeIndex zentriert ---
const visibleDots = computed(() => {
  const total = normalizedImages.value.length
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
const galleryImageHeight = ref<number>(GALLERY_MAX_HEIGHT)
let heightRequestId = 0

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

  const urls = Array.from(
    new Set(
      normalizedImages.value
        .map((item) => item.urlDefault || item.urlSmall || '')
        .filter((url): url is string => Boolean(url))
    )
  )

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

watch(normalizedImages, () => {
  void refreshGalleryImageHeight()
}, { immediate: true })

onMounted(() => {
  void refreshGalleryImageHeight()
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
      <div v-if="isGridLayout" class="w-full px-2 py-4 flex flex-wrap items-start gap-4">
        <div
          v-for="(item, index) in normalizedImages"
          :key="item.urlDefault || item.urlSmall || String(index)"
          class="shrink-0 overflow-hidden rounded bg-white"
          :style="{ height: `${galleryImageHeight}px` }"
        >
          <img
            :src="item.urlSmall || item.urlDefault || ''"
            :alt="item.alt || ''"
            :title="item.title || ''"
            class="block h-full w-auto max-w-none object-cover"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          >
        </div>
      </div>

      <!-- relative => Overlay kann am unteren Rand "kleben" -->
      <div v-else class="relative w-full">
        <UCarousel
          ref="carousel"
          v-slot="{ item }"
          :items="normalizedImages"
          :ui="carouselUi"
          align="start"
          autoplay
          class="relative z-10"
          @pointerdown="disableAutoplay"
          @touchstart="disableAutoplay"
          @select="onSelect"
        >
          <div class="flex w-full items-start justify-center overflow-hidden bg-white" :style="{ height: `${galleryImageHeight}px` }">
            <img
              :src="item.urlDefault || item.urlSmall || ''"
              :alt="item.alt || ''"
              :title="item.title || ''"
              class="block h-full w-auto max-w-none object-cover"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            >
          </div>
        </UCarousel>

        <CarouselControls
          :visible-dots="visibleDots"
          :active-index="activeIndex"
          :show-arrows="normalizedImages.length > 1"
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
