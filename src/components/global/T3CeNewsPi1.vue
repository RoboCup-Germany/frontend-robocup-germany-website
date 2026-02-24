<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed, ref } from 'vue';

defineOptions({
  inheritAttrs: false
});

type NewsMedia = {
  images?: {
    listViewImage?: { publicUrl?: string | null } | null;
    listViewFeaturedImage?: { publicUrl?: string | null } | null;
    listViewVerticalImage?: { publicUrl?: string | null } | null;
    defaultImage?: { publicUrl?: string | null } | null;
  } | null;
  properties?: {
    title?: string | null;
    alternative?: string | null;
    description?: string | null;
  } | null;
} | null;

type NewsAuthor = {
  author?: string;
  authorEmail?: string;
} | null;

type NewsItem = {
  uid?: number;
  title?: string;
  subtitle?: string;
  teaser?: string;
  bodytext?: string;
  datetime?: string;
  crdate?: string;
  tstamp?: string;
  slug?: string;
  pathSegment?: string;
  moreLink?: string;
  author?: NewsAuthor;
  media?: NewsMedia[];
  categories?: Array<{ title?: string } | string> | string;
} | null;

type PaginationItem = {
  page?: number;
  link?: string;
  current?: number;
} | null;

type Pagination = {
  first?: string | null;
  last?: string | null;
  prev?: string | null;
  next?: string | null;
  pages?: PaginationItem[];
} | null;

type NewsListData = {
  list?: NewsItem[];
  pagination?: Pagination;
} | null;

interface T3CeNewsPi1Props extends T3CeBaseProps {
  header?: string;
  subheader?: string;
  data?: NewsListData;
}

const props = withDefaults(defineProps<T3CeNewsPi1Props>(), {
  header: '',
  subheader: '',
  data: undefined
});

const route = useRoute();
const viewMode = ref<'image' | 'minimal'>('image');

const newsItems = computed(() => {
  const list = props.data?.list;
  return Array.isArray(list) ? list.filter(Boolean) : [];
});

const pagination = computed(() => props.data?.pagination || null);

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (item: NewsItem): string => {
  const raw = item?.datetime || item?.crdate || item?.tstamp || '';
  const parsed = parseDate(raw);
  if (!parsed) return raw;

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
};

const extractCategory = (item: NewsItem): string => {
  const source = item?.categories;

  if (typeof source === 'string') {
    return source.trim();
  }

  if (Array.isArray(source)) {
    for (const category of source) {
      if (typeof category === 'string' && category.trim()) {
        return category.trim();
      }
      if (category && typeof category === 'object' && typeof category.title === 'string' && category.title.trim()) {
        return category.title.trim();
      }
    }
  }

  return '';
};

const resolveSlug = (item: NewsItem): string => {
  const slug = item?.slug?.trim();
  if (slug) return slug;

  const segment = item?.pathSegment?.trim();
  if (segment) return `/news/${segment}`;

  return '/news';
};

const resolveImageUrl = (item: NewsItem): string => {
  const media = Array.isArray(item?.media) && item?.media.length > 0 ? item.media[0] : null;
  if (!media) return '';

  return (
    media.images?.listViewImage?.publicUrl?.trim()
    || media.images?.listViewFeaturedImage?.publicUrl?.trim()
    || media.images?.listViewVerticalImage?.publicUrl?.trim()
    || media.images?.defaultImage?.publicUrl?.trim()
    || ''
  );
};

const resolveImageAlt = (item: NewsItem): string => {
  const media = Array.isArray(item?.media) && item?.media.length > 0 ? item.media[0] : null;
  if (!media) return item?.title?.trim() || 'News Bild';

  return (
    media.properties?.alternative?.trim()
    || media.properties?.description?.trim()
    || media.properties?.title?.trim()
    || item?.title?.trim()
    || 'News Bild'
  );
};

const isEnglishPage = computed(() => {
  return route.path === '/en' || route.path.startsWith('/en/');
});

const localizedReadMore = computed(() => (isEnglishPage.value ? 'Read more' : 'Mehr erfahren'));
const localizedImageView = computed(() => (isEnglishPage.value ? 'Image view' : 'Bildansicht'));
const localizedMinimalView = computed(() => (isEnglishPage.value ? 'Minimal view' : 'Minimalansicht'));
const localizedDateLabel = computed(() => (isEnglishPage.value ? 'Date' : 'Datum'));
const localizedCategoryLabel = computed(() => (isEnglishPage.value ? 'Category' : 'Kategorie'));
const localizedTitleLabel = computed(() => (isEnglishPage.value ? 'Title' : 'Titel'));
const localizedAuthorLabel = computed(() => (isEnglishPage.value ? 'Author' : 'Autor'));

const resolveMoreLabel = (item: NewsItem): string => {
  const raw = item?.moreLink?.trim() || '';
  if (!raw) return localizedReadMore.value;

  const normalized = raw.toLowerCase();
  if (normalized === 'read more' || normalized === 'mehr erfahren') {
    return localizedReadMore.value;
  }

  return raw;
};

const resolvePaginationHref = (link?: string | null): string => {
  const raw = link?.trim();
  if (!raw) return route.fullPath;

  // Keep TYPO3-provided query strings intact; only normalize absolute links to local path+query+hash.
  if (raw.startsWith('?') || raw.startsWith('#') || raw.startsWith('/')) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return `${url.pathname}${url.search}${url.hash}`;
    }
    catch {
      return raw;
    }
  }

  return raw;
};
</script>

<template>
  <section class="pb-12 lg:pb-20">
    <UContainer>
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
        <div v-if="header || subheader">
          <h2 v-if="header" class="mb-2">{{ header }}</h2>
          <p v-if="subheader" class="text-base italic text-black/80">{{ subheader }}</p>
        </div>

        <div class="ml-auto inline-flex rounded-full border border-black/20 p-1">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
            :class="viewMode === 'image' ? 'bg-primary text-white' : 'text-black hover:bg-black/5'"
            @click="viewMode = 'image'"
          >
            {{ localizedImageView }}
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
            :class="viewMode === 'minimal' ? 'bg-primary text-white' : 'text-black hover:bg-black/5'"
            @click="viewMode = 'minimal'"
          >
            {{ localizedMinimalView }}
          </button>
        </div>
      </div>

      <div
        v-if="viewMode === 'minimal'"
        class="hidden border-y border-black/20 bg-black/[0.02] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-black/70 md:grid md:grid-cols-12 md:gap-4"
      >
        <span class="md:col-span-2">{{ localizedDateLabel }}</span>
        <span class="md:col-span-2">{{ localizedCategoryLabel }}</span>
        <span class="md:col-span-5">{{ localizedTitleLabel }}</span>
        <span class="md:col-span-2">{{ localizedAuthorLabel }}</span>
        <span class="text-right md:col-span-1">{{ localizedReadMore }}</span>
      </div>

      <ul v-if="newsItems.length > 0" class="border-b border-black/20">
        <li v-for="item in newsItems" :key="item?.uid || item?.slug || item?.title">
          <NuxtLink
            :to="resolveSlug(item)"
            class="group block border-t border-black/10 py-6 lg:py-7"
            :class="viewMode === 'minimal' ? 'px-4 md:py-4 lg:py-4' : ''"
          >
            <article v-if="viewMode === 'image'" class="grid grid-cols-1 gap-5 md:grid-cols-12 md:items-start">
              <div class="overflow-hidden rounded-sm bg-black/5 md:col-span-4 lg:col-span-3">
                <NuxtImg
                  v-if="resolveImageUrl(item)"
                  :src="resolveImageUrl(item)"
                  :alt="resolveImageAlt(item)"
                  class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] md:h-36"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                  format="webp"
                  :quality="80"
                />
                <div
                  v-else
                  class="flex h-44 w-full items-center justify-center text-sm text-black/50 md:h-36"
                >
                  Kein Bild
                </div>
              </div>

              <div class="md:col-span-8 lg:col-span-9">
                <p class="mb-2 text-sm uppercase tracking-wide text-black/65">
                  <span v-if="formatDate(item)">{{ formatDate(item) }}</span>
                  <span v-if="extractCategory(item)" class="ml-3">Kategorie: {{ extractCategory(item) }}</span>
                  <span v-if="item?.author?.author" class="ml-3">von {{ item.author.author }}</span>
                </p>

                <h3 class="mt-0 mb-2 !text-black transition-colors group-hover:text-primary">
                  {{ item?.title }}
                </h3>

                <p v-if="item?.subtitle" class="mb-2 text-base italic text-black/80">
                  {{ item.subtitle }}
                </p>

                <p v-if="item?.teaser" class="mb-2 text-base text-black/85">
                  {{ item.teaser }}
                </p>

                <div v-if="item?.bodytext" class="rte-content text-black/85">
                  <T3HtmlParser :content="item.bodytext" />
                </div>

                <span class="mt-4 inline-flex text-sm font-semibold text-primary group-hover:underline">
                  {{ resolveMoreLabel(item) }}
                </span>
              </div>
            </article>

            <article
              v-else
              class="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-center md:gap-4"
            >
              <p class="text-sm text-black/80 md:col-span-2 md:truncate">
                {{ formatDate(item) || '-' }}
              </p>
              <p class="text-sm text-black/80 md:col-span-2 md:truncate">
                {{ extractCategory(item) || '-' }}
              </p>
              <h3 class="m-0 text-base !text-black transition-colors group-hover:text-primary md:col-span-5 md:truncate">
                {{ item?.title }}
              </h3>
              <p class="text-sm text-black/80 md:col-span-2 md:truncate">
                {{ item?.author?.author || '-' }}
              </p>
              <span class="text-sm font-semibold text-primary group-hover:underline md:col-span-1 md:text-right">
                {{ resolveMoreLabel(item) }}
              </span>
            </article>
          </NuxtLink>
        </li>
      </ul>

      <p v-else class="text-black/70">Keine News gefunden.</p>

      <nav
        v-if="pagination?.pages && pagination.pages.length > 1"
        aria-label="Pagination"
        class="mt-8 flex flex-wrap items-center gap-2"
      >
        <a
          v-if="pagination.prev"
          :href="resolvePaginationHref(pagination.prev)"
          class="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Zurück
        </a>

        <a
          v-for="page in pagination.pages"
          :key="`page-${page?.page}`"
          :href="resolvePaginationHref(page?.link)"
          class="rounded-full border px-4 py-2 text-sm font-semibold"
          :class="page?.current === 1 ? 'border-primary bg-primary text-white' : 'border-black/20 hover:bg-black/5'"
          :aria-current="page?.current === 1 ? 'page' : undefined"
        >
          {{ page?.page }}
        </a>

        <a
          v-if="pagination.next"
          :href="resolvePaginationHref(pagination.next)"
          class="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Weiter
        </a>
      </nav>
    </UContainer>
  </section>
</template>
