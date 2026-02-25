<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed, onMounted, onUnmounted, ref, useAttrs, watch } from 'vue'
import CarouselControls from '~/components/basic/CarouselControls.vue'
import Headline from '~/components/basic/Headline.vue'

defineOptions({ inheritAttrs: false })

interface FlickrGalleryContent {
  album_id?: string | null
  album_name?: string | null
  header?: string | null
  subheader?: string | null
  bodytext?: string | null
  user_id?: string | null
  flickr_user_id?: string | null
  per_page?: number | string | null
  album_layout?: number | string | null
  layout?: number | string | null
}

interface T3CeRcgFlickrgallery extends T3CeBaseProps {
  content?: FlickrGalleryContent | string | null
  album_id?: string | null
  album_name?: string | null
  header?: string | null
  subheader?: string | null
  bodytext?: string | null
  user_id?: string | null
  flickr_user_id?: string | null
  per_page?: number | string | null
  album_layout?: number | string | null
  layout?: number | string | null
}

interface FlickrSlide {
  id: string
  title: string
  alt: string
  src: string
  thumb: string
  width?: number | null
  height?: number | null
}

interface FlickrPhotosetResponse {
  title?: string
  page?: number
  totalPages?: number
  hasMore?: boolean
  photos?: FlickrSlide[]
}

const props = withDefaults(defineProps<T3CeRcgFlickrgallery>(), {
  flickr_user_id: '200186101@N05'
})

const attrs = useAttrs()

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch { return null }
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  const parsed = tryParseJson(value)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null
}

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

const extractAlbumIdFromUrl = (value: string): string => {
  const match = value.match(/\/albums\/(\d+)/i)
  return match?.[1] || ''
}

const shuffleSlides = (items: FlickrSlide[]): FlickrSlide[] => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = out[i]
    out[i] = out[j]
    out[j] = temp
  }
  return out
}

const preloadSlides = async (slides: FlickrSlide[]): Promise<FlickrSlide[]> => {
  if (!import.meta.client || slides.length === 0) return slides

  const checks = slides.map((slide) => new Promise<FlickrSlide | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(slide)
    img.onerror = () => resolve(null)
    img.src = slide.src
  }))

  const loaded = await Promise.all(checks)
  return loaded.filter((slide): slide is FlickrSlide => Boolean(slide))
}

const contentData = computed<Record<string, unknown>>(() => {
  return asRecord(props.content) || asRecord(attrs.content) || {}
})

const albumIdRaw = computed(() => pickString(
  contentData.value.album_id,
  props.album_id,
  attrs.album_id
))

const albumId = computed(() => {
  return extractAlbumIdFromUrl(albumIdRaw.value) || albumIdRaw.value
})

const flickrUserId = computed(() => pickString(
  contentData.value.user_id,
  contentData.value.flickr_user_id,
  props.user_id,
  props.flickr_user_id,
  attrs.user_id,
  attrs.flickr_user_id,
  '200186101@N05'
))

const photoLink = (photoId: string): string => {
  return `https://www.flickr.com/photos/${flickrUserId.value}/${photoId}`
}

const perPage = computed(() => {
  const value = contentData.value.per_page ?? props.per_page ?? attrs.per_page
  return Math.min(toPositiveInt(value, 30), 200)
})

const albumLayout = computed(() => {
  const value = contentData.value.album_layout
    ?? contentData.value.layout
    ?? props.album_layout
    ?? props.layout
    ?? attrs.album_layout
    ?? attrs.layout
  return toPositiveInt(value, 0)
})

const isGridLayout = computed(() => albumLayout.value === 1)
const MOBILE_BREAKPOINT = 768
const viewportWidth = ref(MOBILE_BREAKPOINT)

const updateViewportWidth = () => {
  if (!import.meta.client) return
  viewportWidth.value = window.innerWidth || MOBILE_BREAKPOINT
}

const isMobileViewport = computed(() => {
  if (!import.meta.client) return false
  return viewportWidth.value < MOBILE_BREAKPOINT
})

const effectivePerPage = computed(() => {
  if (!isGridLayout.value) return perPage.value
  return isMobileViewport.value ? 5 : 15
})

const header = computed(() => pickString(
  contentData.value.header,
  props.header,
  attrs.header
))

const subheader = computed(() => pickString(
  contentData.value.subheader,
  props.subheader,
  attrs.subheader
))

const bodytext = computed(() => pickString(
  contentData.value.bodytext,
  props.bodytext,
  attrs.bodytext
))

const albumName = computed(() => pickString(
  contentData.value.album_name,
  props.album_name,
  attrs.album_name
))

const photoLinkTitle = (photo: FlickrSlide): string => {
  return photo.title || albumName.value || photosetTitle.value || 'Öffnen auf flickr.de'
}

const currentIndex = ref(0)
const navigationDirection = ref<1 | -1>(1)
const paused = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const photos = ref<FlickrSlide[]>([])
const photosetTitle = ref('')
const currentPage = ref(1)
const hasMorePhotos = ref(false)
let autoTimer: ReturnType<typeof setInterval> | null = null

const hasPhotos = computed(() => photos.value.length > 0)
const hasMultiplePhotos = computed(() => photos.value.length > 1)
const loadMoreLabel = computed(() => `${effectivePerPage.value} weitere Bilder laden`)

const displayTitle = computed(() => {
  return photosetTitle.value
})

const activePhoto = computed(() => {
  if (!photos.value.length) return null
  return photos.value[currentIndex.value] || photos.value[0]
})

const nextSlide = () => {
  if (!photos.value.length) return
  navigationDirection.value = 1
  currentIndex.value = (currentIndex.value + 1) % photos.value.length
}

const prevSlide = () => {
  if (!photos.value.length) return
  navigationDirection.value = -1
  currentIndex.value = (currentIndex.value - 1 + photos.value.length) % photos.value.length
}

const selectSlide = (index: number) => {
  if (!photos.value.length) return
  if (index === currentIndex.value) return
  navigationDirection.value = index > currentIndex.value ? 1 : -1
  currentIndex.value = index
}

const visibleDots = computed(() => {
  const total = photos.value.length
  if (total <= 1) return []

  const max = Math.min(5, total)
  let start = currentIndex.value - Math.floor(max / 2)

  start = Math.max(0, start)
  start = Math.min(start, total - max)

  return Array.from({ length: max }, (_, k) => start + k)
})

const dotTransitionName = computed(() => {
  return navigationDirection.value === 1 ? 'dots-forward' : 'dots-backward'
})

const stopAutoplay = () => {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

const startAutoplay = () => {
  stopAutoplay()
  if (isGridLayout.value) return
  if (!hasMultiplePhotos.value) return

  autoTimer = setInterval(() => {
    if (!paused.value) {
      nextSlide()
    }
  }, 4000)
}

const fetchPhotos = async (pageToLoad: number, append = false) => {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  errorMessage.value = ''

  try {
    const response = await $fetch<FlickrPhotosetResponse>('/api/flickr-photoset', {
      query: {
        photosetId: albumId.value,
        userId: flickrUserId.value,
        perPage: effectivePerPage.value,
        page: pageToLoad
      }
    })

    const loaded = Array.isArray(response.photos) ? response.photos : []
    const shuffledChunk = shuffleSlides(loaded)
    const preparedChunk = append ? await preloadSlides(shuffledChunk) : shuffledChunk

    photos.value = append ? [...photos.value, ...preparedChunk] : preparedChunk
    photosetTitle.value = (response.title || '').trim()
    currentPage.value = typeof response.page === 'number' && response.page > 0
      ? response.page
      : pageToLoad
    hasMorePhotos.value = Boolean(response.hasMore)

    if (photos.value.length === 0) {
      errorMessage.value = 'Keine Bilder im Flickr-Album gefunden.'
    }

    if (!append) {
      currentIndex.value = 0
    }
  } catch (error) {
    if (!append) {
      photos.value = []
      photosetTitle.value = ''
    }
    errorMessage.value = 'Flickr Galerie konnte nicht geladen werden.'
    console.error('Flickr gallery error:', error)
  } finally {
    if (append) {
      loadingMore.value = false
    } else {
      loading.value = false
      startAutoplay()
    }
  }
}

const loadPhotos = async () => {
  if (!albumId.value) {
    photos.value = []
    photosetTitle.value = ''
    currentPage.value = 1
    hasMorePhotos.value = false
    errorMessage.value = 'Es fehlt eine Flickr Album-ID.'
    return
  }

  currentPage.value = 1
  hasMorePhotos.value = false
  await fetchPhotos(1, false)
}

const loadMorePhotos = async () => {
  if (loadingMore.value || loading.value || !hasMorePhotos.value) return
  await fetchPhotos(currentPage.value + 1, true)
}

watch([albumId, flickrUserId, effectivePerPage], loadPhotos, { immediate: true })
watch(hasMultiplePhotos, () => startAutoplay())
watch(isGridLayout, () => startAutoplay())

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
  startAutoplay()
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateViewportWidth)
  }
  stopAutoplay()
})
</script>

<template>
  <section class="w-full">
    <UContainer>
      <div class="w-full">
        <Headline v-if="header" :raw-html="header" />
        <div v-if="subheader" class="mb-4 text-base italic uppercase tracking-wide text-black font-semibold">
          <T3HtmlParser class="rte-content" :content="subheader" />
        </div>

        <p v-if="!header && !subheader && displayTitle" class="mb-4 font-semibold">{{ displayTitle }}</p>

        <div
          class="relative w-full overflow-visible rounded-md bg-neutral-100"
          @mouseenter="paused = true"
          @mouseleave="paused = false"
        >
          <div v-if="isGridLayout" class="p-4 columns-1 md:columns-2 lg:columns-3">
            <a
              v-for="photo in photos"
              :key="photo.id"
              :href="photoLink(photo.id)"
              :title="photoLinkTitle(photo)"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded bg-white"
            >
              <img
                :src="photo.src"
                :alt="photo.alt"
                :width="photo.width || undefined"
                :height="photo.height || undefined"
                class="block h-auto w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
              />
              <span
                class="pointer-events-none absolute bottom-2 right-2 rounded bg-primary/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                Öffnen auf flickr.de
              </span>
            </a>
          </div>

          <div v-else class="relative h-[clamp(300px,52vw,640px)] w-full" :class="{ 'mb-4': hasMultiplePhotos }">
            <transition name="flickr-fade" mode="out-in">
              <img
                v-if="activePhoto"
                :key="activePhoto.id"
                :src="activePhoto.src"
                :alt="activePhoto.alt"
                :width="activePhoto.width || undefined"
                :height="activePhoto.height || undefined"
                class="h-full w-full bg-white object-contain"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
              />
            </transition>

            <a
              v-if="activePhoto"
              :href="photoLink(activePhoto.id)"
              :title="photoLinkTitle(activePhoto)"
              target="_blank"
              rel="noopener noreferrer"
              class="absolute right-3 top-3 z-40 rounded bg-primary/80 px-3 py-1.5 text-xs text-white transition-all duration-200 ease-out hover:bg-primary hover:scale-[1.04] md:top-auto md:bottom-3"
            >
              Öffnen auf flickr.de
            </a>

            <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
              Bilder werden geladen ...
            </div>

            <div
              v-if="errorMessage && !loading"
              class="absolute inset-0 flex items-center justify-center bg-black/40 px-4 text-center text-white"
            >
              {{ errorMessage }}
            </div>

            <CarouselControls
              v-if="hasMultiplePhotos"
              :visible-dots="visibleDots"
              :active-index="currentIndex"
              :show-arrows="true"
              :animate-dots="true"
              :transition-name="dotTransitionName"
              @prev="prevSlide"
              @next="nextSlide"
              @select="selectSlide"
            />
          </div>

        </div>

        <div v-if="isGridLayout && hasMorePhotos" class="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            class="rounded bg-primary px-4 py-2 text-white disabled:opacity-60"
            :disabled="loadingMore"
            @click="loadMorePhotos"
          >
            {{ loadingMore ? 'Lade weitere Bilder ...' : loadMoreLabel }}
          </button>

          <span
            v-if="loadingMore"
            class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-primary"
            aria-label="Lade weitere Bilder"
          />
        </div>

        <p v-if="!loading && !isGridLayout && hasPhotos && activePhoto?.title" class="relative z-40 mt-3 text-sm text-gray-700">
          {{ activePhoto.title }}
        </p>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.flickr-fade-enter-active,
.flickr-fade-leave-active {
  transition: opacity 250ms ease;
}

.flickr-fade-enter-from,
.flickr-fade-leave-to {
  opacity: 0;
}
</style>
