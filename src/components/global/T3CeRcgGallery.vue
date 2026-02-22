<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed, ref, type Ref, useAttrs } from 'vue'
import CarouselControls from '~/components/basic/CarouselControls.vue'
import Image from '~/components/basic/Image.vue'
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


// --- Carousel control / active index (für Custom-Dots) ---
interface EmblaLike {
  emblaApi?: {
    scrollTo: (index: number) => void
    scrollPrev?: () => void
    scrollNext?: () => void
  }
}
const carousel: Ref<EmblaLike | null> = ref(null)
const activeIndex = ref(0)
const navigationDirection = ref<1 | -1>(1)

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
  navigationDirection.value = index > activeIndex.value ? 1 : -1
  activeIndex.value = index
  carousel.value?.emblaApi?.scrollTo(index)
}

function prev() {
  navigationDirection.value = -1
  carousel.value?.emblaApi?.scrollPrev?.()
}

function next() {
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
      <!-- relative => Overlay kann am unteren Rand "kleben" -->
      <div class="relative w-full">
        <UCarousel
            ref="carousel"
            v-slot="{ item }"
            :items="normalizedImages"
            :ui="carouselUi"
            align="start"
            autoplay
            class="relative z-10"
            @select="onSelect"
        >
          <Image :display="item" />
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
