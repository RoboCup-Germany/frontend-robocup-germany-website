<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SectionHeader from '~/components/basic/SectionHeader.vue'

defineOptions({ inheritAttrs: false })

type NewsMedia = {
  images?: {
    listViewImage?: { publicUrl?: string | null } | null
    listViewFeaturedImage?: { publicUrl?: string | null } | null
    listViewVerticalImage?: { publicUrl?: string | null } | null
    defaultImage?: { publicUrl?: string | null } | null
  } | null
  properties?: {
    title?: string | null
    alternative?: string | null
    description?: string | null
  } | null
} | null

type NewsItem = {
  uid?: number
  title?: string
  teaser?: string
  datetime?: string
  crdate?: string
  tstamp?: string
  slug?: string
  pathSegment?: string
  moreLink?: string
  media?: NewsMedia[]
  categories?: Array<{ title?: string } | string> | string
} | null

type PaginationItem = {
  page?: number
  link?: string
  current?: number
} | null

type Pagination = {
  prev?: string | null
  next?: string | null
  pages?: PaginationItem[]
} | null

type NewsListData = {
  list?: NewsItem[]
  pagination?: Pagination
} | null

interface T3CeNewsNewsliststickyProps extends T3CeBaseProps {
  header?: string
  subheader?: string
  data?: NewsListData
}

interface EmblaApiLike {
  scrollPrev?: () => void
  scrollNext?: () => void
  canScrollPrev?: () => boolean
  canScrollNext?: () => boolean
  scrollTo: (index: number) => void
  selectedScrollSnap?: () => number
  scrollSnapList?: () => number[]
}

interface CarouselRefLike {
  emblaApi?: EmblaApiLike
}

const props = withDefaults(defineProps<T3CeNewsNewsliststickyProps>(), {
  header: '',
  subheader: '',
  data: undefined
})

const route = useRoute()
const isLoadingPage = ref(false)
const fetchError = ref('')
const renderedData = ref<NewsListData>(props.data || null)
const carousel = ref<CarouselRefLike | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)
const pendingEdge = ref<'start' | 'end' | null>('start')
const DESKTOP_BREAKPOINT = 992
const viewportWidth = ref(
  import.meta.client ? (window.innerWidth || DESKTOP_BREAKPOINT) : DESKTOP_BREAKPOINT
)
const selectedChunkIndex = ref(0)

const initialPages = Array.isArray(props.data?.pagination?.pages)
  ? props.data.pagination.pages.filter((page): page is NonNullable<PaginationItem> => Boolean(page))
  : []
const initialCurrentIndex = initialPages.findIndex((entry) => Number(entry.current) === 1)
const persistedPages = ref<Array<NonNullable<PaginationItem>>>(initialPages)
const activePageIndexState = ref(initialCurrentIndex >= 0 ? initialCurrentIndex : 0)
let lastRequestId = 0

const updateViewportWidth = () => {
  if (!import.meta.client) return
  viewportWidth.value = window.innerWidth || 0
}

const cardsPerView = computed(() => (viewportWidth.value >= DESKTOP_BREAKPOINT ? 3 : 1))

const carouselUi = computed(() => ({
  item: 'basis-full',
  container: ''
}))

const newsItems = computed(() => {
  const list = renderedData.value?.list
  return Array.isArray(list) ? list.filter(Boolean) : []
})

const newsChunks = computed<NewsItem[][]>(() => {
  const size = cardsPerView.value
  if (size < 1 || newsItems.value.length === 0) return []

  const chunks: NewsItem[][] = []
  for (let i = 0; i < newsItems.value.length; i += size) {
    chunks.push(newsItems.value.slice(i, i + size))
  }
  return chunks
})

const pagination = computed(() => renderedData.value?.pagination || null)

const pageEntries = computed(() => {
  const rawPages = pagination.value?.pages
  if (Array.isArray(rawPages) && rawPages.length > 0) {
    const normalized = rawPages.filter((page): page is NonNullable<PaginationItem> => Boolean(page))
    if (normalized.length >= persistedPages.value.length) {
      return normalized
    }
  }
  return persistedPages.value
})

const activePageIndex = computed(() => {
  const foundIndex = pageEntries.value.findIndex((entry) => Number(entry.current) === 1)
  if (foundIndex >= 0) return foundIndex
  return Math.min(Math.max(activePageIndexState.value, 0), Math.max(0, pageEntries.value.length - 1))
})

const updateCarouselState = () => {
  const api = carousel.value?.emblaApi
  if (!api) {
    canScrollPrev.value = false
    canScrollNext.value = false
    return
  }

  canScrollPrev.value = Boolean(api.canScrollPrev?.())
  canScrollNext.value = Boolean(api.canScrollNext?.())
  selectedChunkIndex.value = api.selectedScrollSnap?.() ?? 0
}

const onCarouselSelect = () => {
  updateCarouselState()
}

const getEmblaApi = async (): Promise<EmblaApiLike | null> => {
  let api = carousel.value?.emblaApi
  if (api) return api

  await nextTick()
  api = carousel.value?.emblaApi
  if (api) {
    updateCarouselState()
    return api
  }

  return null
}

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth, { passive: true })
  nextTick(() => {
    updateCarouselState()
  })
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('resize', updateViewportWidth)
})

watch(
  () => props.data,
  (next) => {
    if (!isLoadingPage.value) {
      renderedData.value = next || null
      pendingEdge.value = 'start'

      const pages = next?.pagination?.pages
      if (Array.isArray(pages) && pages.length > 0) {
        const normalized = pages.filter((page): page is NonNullable<PaginationItem> => Boolean(page))
        if (normalized.length >= persistedPages.value.length) {
          persistedPages.value = normalized
        }
        const currentIndex = normalized.findIndex((entry) => Number(entry.current) === 1)
        activePageIndexState.value = currentIndex >= 0 ? currentIndex : 0
      }
    }
  },
  { immediate: true }
)

watch(
  () => [newsChunks.value.length, cardsPerView.value],
  async () => {
    await nextTick()
    const api = carousel.value?.emblaApi
    if (!api) return

    if (pendingEdge.value === 'end') {
      const snaps = api.scrollSnapList?.() || []
      api.scrollTo(Math.max(0, snaps.length - 1))
    } else {
      api.scrollTo(0)
    }

    pendingEdge.value = null
    updateCarouselState()
  }
)

watch(cardsPerView, async () => {
  pendingEdge.value = 'start'
  await nextTick()
  updateCarouselState()
})

const parseDate = (value?: string): Date | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDate = (item: NewsItem): string => {
  const raw = item?.datetime || item?.crdate || item?.tstamp || ''
  const parsed = parseDate(raw)
  if (!parsed) return raw

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parsed)
}

const extractCategory = (item: NewsItem): string => {
  const source = item?.categories

  if (typeof source === 'string') {
    return source.trim()
  }

  if (Array.isArray(source)) {
    for (const category of source) {
      if (typeof category === 'string' && category.trim()) {
        return category.trim()
      }
      if (category && typeof category === 'object' && typeof category.title === 'string' && category.title.trim()) {
        return category.title.trim()
      }
    }
  }

  return ''
}

const resolveSlug = (item: NewsItem): string => {
  const slug = item?.slug?.trim()
  if (slug) return slug

  const segment = item?.pathSegment?.trim()
  if (segment) return `/news/${segment}`

  return '/news'
}

const resolveImageUrl = (item: NewsItem): string => {
  const media = Array.isArray(item?.media) && item?.media.length > 0 ? item.media[0] : null
  if (!media) return ''

  return (
    media.images?.listViewFeaturedImage?.publicUrl?.trim()
    || media.images?.listViewVerticalImage?.publicUrl?.trim()
    || media.images?.listViewImage?.publicUrl?.trim()
    || media.images?.defaultImage?.publicUrl?.trim()
    || ''
  )
}

const resolveImageAlt = (item: NewsItem): string => {
  const media = Array.isArray(item?.media) && item?.media.length > 0 ? item.media[0] : null
  if (!media) return item?.title?.trim() || 'News Bild'

  return (
    media.properties?.alternative?.trim()
    || media.properties?.description?.trim()
    || media.properties?.title?.trim()
    || item?.title?.trim()
    || 'News Bild'
  )
}

const isEnglishPage = computed(() => route.path === '/en' || route.path.startsWith('/en/'))
const localizedReadMore = computed(() => (isEnglishPage.value ? 'Read more' : 'Mehr erfahren'))
const localizedNoImage = computed(() => (isEnglishPage.value ? 'No image' : 'Kein Bild'))
const localizedNoNews = computed(() => (isEnglishPage.value ? 'No news found.' : 'Keine News gefunden.'))
const localizedPreviousPage = computed(() => (isEnglishPage.value ? 'Previous page' : 'Vorherige Seite'))
const localizedNextPage = computed(() => (isEnglishPage.value ? 'Next page' : 'Nächste Seite'))

const resolveMoreLabel = (item: NewsItem): string => {
  const raw = item?.moreLink?.trim() || ''
  if (!raw) return localizedReadMore.value

  const normalized = raw.toLowerCase()
  if (normalized === 'read more' || normalized === 'mehr erfahren') {
    return localizedReadMore.value
  }

  return raw
}

const resolvePaginationHref = (link?: string | null): string => {
  const raw = link?.trim()
  if (!raw) return ''

  if (raw.startsWith('?') || raw.startsWith('#') || raw.startsWith('/')) {
    return raw
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw)
      return `${url.pathname}${url.search}${url.hash}`
    }
    catch {
      return raw
    }
  }

  return raw
}

const resolveApiPathFromHref = (href: string): string => {
  if (href.startsWith('/')) {
    return `/api/typo3${href}`
  }

  if (href.startsWith('?')) {
    return `/api/typo3${route.path}${href}`
  }

  try {
    const parsed = new URL(href)
    return `/api/typo3${parsed.pathname}${parsed.search}`
  }
  catch {
    return `/api/typo3/${href.replace(/^\/+/, '')}`
  }
}

const extractStickyData = (payload: unknown): NewsListData | null => {
  if (!payload || typeof payload !== 'object') return null
  const source = payload as { content?: Record<string, unknown[]> }
  const columns = source.content
  if (!columns || typeof columns !== 'object') return null

  const currentUid = Number(props.uid)
  const hasCurrentUid = Number.isFinite(currentUid)
  let fallback: NewsListData | null = null

  for (const elements of Object.values(columns)) {
    if (!Array.isArray(elements)) continue
    for (const entry of elements) {
      if (!entry || typeof entry !== 'object') continue
      const element = entry as {
        id?: unknown
        type?: unknown
        content?: { data?: NewsListData }
      }
      if (element.type !== 'news_newsliststicky') continue

      const data = element.content?.data
      if (!data || typeof data !== 'object') continue
      if (!fallback) fallback = data

      const elementId = Number(element.id)
      if (hasCurrentUid && Number.isFinite(elementId) && elementId === currentUid) {
        return data
      }
    }
  }

  return fallback
}

const goToPaginationLink = async (link?: string | null, mode: 'start' | 'end' = 'start') => {
  const href = resolvePaginationHref(link)
  if (!href || isLoadingPage.value) return

  fetchError.value = ''
  isLoadingPage.value = true
  const requestId = ++lastRequestId

  try {
    const payload = await $fetch<unknown>(resolveApiPathFromHref(href))
    if (requestId !== lastRequestId) return

    const nextData = extractStickyData(payload)
    if (nextData) {
      renderedData.value = nextData

      const nextPages = nextData.pagination?.pages
      if (Array.isArray(nextPages) && nextPages.length > 0) {
        const normalized = nextPages.filter((page): page is NonNullable<PaginationItem> => Boolean(page))
        if (normalized.length >= persistedPages.value.length) {
          persistedPages.value = normalized
        }
      }

      const nextCurrent = pageEntries.value.findIndex((entry) => Number(entry.current) === 1)
      if (nextCurrent >= 0) {
        activePageIndexState.value = nextCurrent
      }

      pendingEdge.value = mode
      return
    }

    fetchError.value = 'Die nächsten News konnten nicht geladen werden.'
  }
  catch {
    if (requestId !== lastRequestId) return
    fetchError.value = 'Die nächsten News konnten nicht geladen werden.'
  }
  finally {
    if (requestId === lastRequestId) {
      isLoadingPage.value = false
    }
  }
}

const goToPrevPage = async () => {
  if (isLoadingPage.value || !newsItems.value.length) return

  const api = await getEmblaApi()
  if (api && selectedChunkIndex.value > 0) {
    api.scrollTo(Math.max(0, selectedChunkIndex.value - 1))
    updateCarouselState()
    return
  }

  const prevLink = pagination.value?.prev || pageEntries.value[activePageIndex.value - 1]?.link
  if (prevLink) {
    activePageIndexState.value = Math.max(0, activePageIndex.value - 1)
    await goToPaginationLink(prevLink, 'end')
  }
}

const goToNextPage = async () => {
  if (isLoadingPage.value || !newsItems.value.length) return

  const api = await getEmblaApi()
  if (api && selectedChunkIndex.value < Math.max(0, newsChunks.value.length - 1)) {
    api.scrollTo(Math.min(newsChunks.value.length - 1, selectedChunkIndex.value + 1))
    updateCarouselState()
    return
  }

  const nextLink = pagination.value?.next || pageEntries.value[activePageIndex.value + 1]?.link
  if (nextLink) {
    activePageIndexState.value = Math.min(pageEntries.value.length - 1, activePageIndex.value + 1)
    await goToPaginationLink(nextLink, 'start')
  }
}

const hasPrevAvailable = computed(() => {
  if (!newsItems.value.length || isLoadingPage.value) return false
  return selectedChunkIndex.value > 0 || canScrollPrev.value || Boolean(pagination.value?.prev || pageEntries.value[activePageIndex.value - 1]?.link)
})

const hasNextAvailable = computed(() => {
  if (!newsItems.value.length || isLoadingPage.value) return false
  return selectedChunkIndex.value < Math.max(0, newsChunks.value.length - 1) || canScrollNext.value || Boolean(pagination.value?.next || pageEntries.value[activePageIndex.value + 1]?.link)
})
</script>

<template>
  <section>
    <UContainer>
      <SectionHeader
        :header="header"
        :subheader="subheader"
        container-class="mb-7 lg:mb-9"
        subheader-class="mb-0 text-base text-black/80"
      />

      <div v-if="newsItems.length > 0" class="news-stage relative mx-auto mb-20 w-full max-w-[1200px] overflow-visible px-5 pb-32 lg:px-8 lg:pb-40">
        <img
          class="news-stage-bg"
          src="/assets/RCgermany_element2.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
        />

        <button
          type="button"
          class="absolute top-1/2 left-0 z-20 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-[0_10px_28px_rgba(0,96,255,0.2)] transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          :aria-label="localizedPreviousPage"
          :disabled="!hasPrevAvailable"
          @click="goToPrevPage"
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
          class="absolute top-1/2 right-0 z-20 inline-flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-[0_10px_28px_rgba(0,96,255,0.2)] transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          :aria-label="localizedNextPage"
          :disabled="!hasNextAvailable"
          @click="goToNextPage"
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
          :key="`news-carousel-${cardsPerView}-${activePageIndex}`"
          v-slot="{ item: chunk }"
          :items="newsChunks"
          :ui="carouselUi"
          :loop="false"
          align="start"
          class="relative z-10"
          @select="onCarouselSelect"
        >
          <ul class="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <li
              v-for="(item, index) in chunk"
              :key="`${activePageIndex}-${index}-${item?.uid || item?.slug || item?.title}`"
              class="h-full"
            >
              <NuxtLink
                :to="resolveSlug(item)"
                class="group flex h-full min-h-[460px] flex-col overflow-hidden rounded-sm bg-white shadow-[0_16px_34px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(0,0,0,0.16)]"
              >
                <div class="relative aspect-[16/10] overflow-hidden bg-black/5">
                  <NuxtPicture
                    provider="ipx"
                    v-if="resolveImageUrl(item)"
                    :src="resolveImageUrl(item)"
                    :alt="resolveImageAlt(item)"
                    class="block h-full w-full"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                    sizes="100vw md:50vw lg:33vw"
                    format="avif,webp"
                    legacy-format="jpeg"
                    :quality="80"
                    :img-attrs="{ class: 'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]' }"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-sm text-black/55"
                  >
                    {{ localizedNoImage }}
                  </div>
                </div>

                <article class="flex h-full flex-col p-4 lg:p-5">
                  <p class="mb-3 text-xs uppercase tracking-[0.14em] text-black/65">
                    <span v-if="formatDate(item)">{{ formatDate(item) }}</span>
                    <span v-if="extractCategory(item)" class="mx-2 text-black/35">•</span>
                    <span v-if="extractCategory(item)">{{ extractCategory(item) }}</span>
                  </p>

                  <h3 class="news-teaser-title mt-0 mb-0 !text-black transition-colors group-hover:text-primary">
                    {{ item?.title }}
                  </h3>

                  <p class="news-teaser-text mt-3 mb-0 text-sm text-black/85">
                    {{ item?.teaser || '\u00A0' }}
                  </p>

                  <span class="mt-auto pt-4 inline-flex text-sm font-semibold text-primary group-hover:underline">
                    {{ resolveMoreLabel(item) }}
                  </span>
                </article>
              </NuxtLink>
            </li>
          </ul>
        </UCarousel>
      </div>

      <p v-else class="text-black/70">
        {{ localizedNoNews }}
      </p>

      <p v-if="fetchError" class="mt-4 text-sm text-red-700">
        {{ fetchError }}
      </p>
    </UContainer>
  </section>
</template>

<style scoped>
.news-stage-bg {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 0;
  width: 100vw;
  max-width: 100vw;
  height: auto;
  transform: translateX(-50%);
  pointer-events: none;
  user-select: none;
}

.news-teaser-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.news-teaser-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
</style>
