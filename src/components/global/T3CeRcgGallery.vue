<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed, ref, type Ref, useAttrs } from 'vue'
import CarouselControls from '~/components/basic/CarouselControls.vue'
import Image from '~/components/basic/Image.vue'

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

// Helpers
const tryParseJson = (val: unknown): unknown => {
  if (typeof val !== 'string') return val
  try { return JSON.parse(val) } catch { return null }
}

// Extract an array of items from various container shapes or wrap a single item
const extractArray = (input: unknown): unknown[] => {
  const val = tryParseJson(input)

  // direct array
  if (Array.isArray(val)) return val as unknown[]

  // object containers with common keys
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    const candidates = ['gallery', 'images', 'media', 'items', 'data']
    for (const key of candidates) {
      const maybe = obj[key]
      if (Array.isArray(maybe)) return maybe as unknown[]
    }

    // looks like a single image object: has url or cropVariants
    const hasUrl = typeof (obj.url as unknown) === 'string'
    const hasCrop = obj.cropVariants && typeof obj.cropVariants === 'object'
    if (hasUrl || hasCrop) return [obj]
  }

  // not recognized
  return []
}

const isImageLike = (v: unknown): boolean => {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  const hasUrl = typeof obj.url === 'string' || typeof obj.originalUrl === 'string' || typeof obj.publicUrl === 'string'
  const hasCrop = !!obj.cropVariants && typeof obj.cropVariants === 'object'
  return hasUrl || hasCrop
}

const findImageLikeDeep = (input: unknown): unknown[] => {
  const out: unknown[] = []
  const seen = new WeakSet<object>()

  const walk = (v: unknown) => {
    if (!v || typeof v !== 'object') return
    if (seen.has(v as object)) return
    seen.add(v as object)

    if (Array.isArray(v)) {
      for (const item of v) walk(item)
      return
    }

    if (isImageLike(v)) {
      out.push(v)
      return
    }

    for (const child of Object.values(v as Record<string, unknown>)) {
      walk(child)
    }
  }

  walk(input)
  return out
}

// Extract block (if provided as object or JSON string)
const blockObj = computed<ThemeGalleryBlock | null>(() => {
  const maybe = tryParseJson(props.block ?? null)
  if (maybe && typeof maybe === 'object') return maybe as ThemeGalleryBlock
  return null
})

// Normalize to an array of unknown items.
// Priority: gallery → images → media → block.gallery → block/media objects
const parsedImages = computed<unknown[]>(() => {
  // Start empty and fill from first non-empty source to avoid masking fallbacks with empty arrays
  let out: unknown[] = []

  if (props.gallery != null) {
    out = extractArray(props.gallery)
  }

  if (out.length === 0 && props.images != null) {
    out = extractArray(props.images)
  }

  if (out.length === 0 && props.media != null) {
    out = extractArray(props.media)
  }

  if (out.length === 0) {
    const b = blockObj.value
    if (b) {
      if (Array.isArray(b.gallery)) out = b.gallery as unknown[]
      else out = extractArray(b as unknown)
    }
  }

  if (out.length === 0 && attrs && typeof attrs === 'object') {
    const rawAttrs = attrs as Record<string, unknown>
    const candidates = ['gallery', 'images', 'media', 'items', 'data', 'block']
    for (const key of candidates) {
      if (out.length > 0) break
      out = extractArray(rawAttrs[key])
    }
    // Fallback: attributes themselves may already be a single image-like object
    // (e.g. { uid, url, cropVariants, ... } from TYPO3 CE payload)
    if (out.length === 0) {
      out = extractArray(rawAttrs)
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

// Display image shape consumed by basic/Image.vue
type DisplayImage = {
  urlDefault?: string | null
  urlSmall?: string | null
  alt?: string | null
  title?: string | null
}

// Type guards/helpers for crop-based entries
type CropDim = { width?: number; height?: number }
type CropVariant = { url?: string | null; dimensions?: CropDim }
type CropVariants = { default?: CropVariant; small?: CropVariant; [k: string]: CropVariant | undefined }
type CroppedContent = {
  url?: string | null
  originalUrl?: string | null
  title?: string | null
  alternative?: string | null
  description?: string | null
  alt?: string | null
  cropVariants?: CropVariants
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object'

const toDisplayImage = (item: unknown): DisplayImage | null => {
  // Case A0: root-level cropped structure as in provided JSON
  // { url, alternative, title, cropVariants: { default: { url }, small: { url } } }
  if (isObject(item)) {
    const root = item as CroppedContent & Record<string, unknown>
    const hasRootCrop = root.cropVariants && typeof root.cropVariants === 'object'
    if (hasRootCrop || root.url || root.originalUrl) {
      const def = (root.cropVariants as CropVariants | undefined)?.default?.url
        || (root.url as string | null)
        || (root.originalUrl as string | null)
        || null
      const sm = (root.cropVariants as CropVariants | undefined)?.small?.url || null
      if (def || sm) {
        return {
          urlDefault: def || null,
          urlSmall: sm || def || null,
          alt: (root.alternative as string | null | undefined)
            ?? (root.alt as string | null | undefined)
            ?? (root.description as string | null | undefined)
            ?? null,
          title: (root.title as string | null | undefined)
            ?? (root.description as string | null | undefined)
            ?? null
        }
      }
    }
  }

  // Case A1: nested under content: { content: { cropVariants..., url, alternative, title } }
  if (isObject(item) && isObject(item.content)) {
    const c = item.content as CroppedContent
    const def = c.cropVariants?.default?.url || c.url || c.originalUrl || null
    const sm = c.cropVariants?.small?.url || null
    if (def || sm) {
      return {
        urlDefault: def || null,
        urlSmall: sm || def || null,
        alt: c.alternative ?? c.alt ?? c.description ?? null,
        title: c.title ?? c.description ?? null
      }
    }
  }

  // Case B: legacy MediaRef-like with publicUrl/alt/title
  if (isObject(item)) {
    const url = (item.publicUrl as string | undefined)
      || (item.url as string | undefined)
      || (item.originalUrl as string | undefined)
      || null
    const alt = (item.alt as string | undefined)
      ?? (item.alternative as string | undefined)
      ?? (item.description as string | undefined)
      ?? null
    const title = (item.title as string | undefined)
      ?? (item.description as string | undefined)
      ?? null
    if (url) {
      return { urlDefault: url, urlSmall: url, alt, title }
    }
  }
  // Unknown - skip
  return null
}

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
