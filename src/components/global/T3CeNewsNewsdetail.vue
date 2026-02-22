<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';

defineOptions({
  inheritAttrs: false
});

type NewsMediaItem = {
  images?: {
    detailViewImage?: { publicUrl?: string | null } | null;
    defaultImage?: { publicUrl?: string | null } | null;
  } | null;
  properties?: {
    title?: string | null;
    alternative?: string | null;
    description?: string | null;
    originalUrl?: string | null;
  } | null;
} | null;

type NewsDetail = {
  title?: string;
  teaser?: string;
  bodytext?: string;
  datetime?: string;
  crdate?: string;
  tstamp?: string;
  media?: NewsMediaItem[];
  backLink?: string;
  canonical?: string;
};

type DetailData = {
  detail?: NewsDetail;
  contentElements?: unknown[];
};

interface T3CeNewsNewsdetailProps extends T3CeBaseProps {
  data?: DetailData;
  detail?: NewsDetail;
  contentElements?: unknown[];
}

const props = withDefaults(defineProps<T3CeNewsNewsdetailProps>(), {
  data: undefined,
  detail: undefined,
  contentElements: () => []
});

const t3Page = useT3Page();

const resolvedDetail = computed<NewsDetail | null>(() => {
  if (props.detail && typeof props.detail === 'object') {
    return props.detail;
  }

  if (props.data?.detail && typeof props.data.detail === 'object') {
    return props.data.detail;
  }

  return null;
});

const nestedContentElements = computed(() => {
  if (Array.isArray(props.contentElements) && props.contentElements.length > 0) {
    return props.contentElements;
  }

  if (Array.isArray(props.data?.contentElements)) {
    return props.data.contentElements;
  }

  return [];
});

const firstMedia = computed<NewsMediaItem>(() => {
  const media = resolvedDetail.value?.media;
  return Array.isArray(media) && media.length > 0 ? media[0] : null;
});

const imageUrl = computed(() => {
  const media = firstMedia.value;
  if (!media) return '';

  return (
    media.images?.detailViewImage?.publicUrl?.trim()
    || media.images?.defaultImage?.publicUrl?.trim()
    || media.properties?.originalUrl?.trim()
    || ''
  );
});

const imageAlt = computed(() => {
  const media = firstMedia.value;
  if (!media) return '';

  return (
    media.properties?.alternative?.trim()
    || media.properties?.description?.trim()
    || media.properties?.title?.trim()
    || resolvedDetail.value?.title?.trim()
    || 'News Bild'
  );
});

const imageDescription = computed(() => {
  return firstMedia.value?.properties?.description?.trim() || '';
});

const rawDate = computed(() => {
  const detail = resolvedDetail.value;
  return detail?.datetime || detail?.crdate || detail?.tstamp || '';
});

const formattedDate = computed(() => {
  const value = rawDate.value.trim();
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
});

const backLinkLabel = computed(() => {
  return resolvedDetail.value?.backLink?.trim() || 'Zurück zur News-Übersicht';
});

const breadcrumbs = computed(() => {
  const items = (t3Page as {
    pageData?: {
      value?: { breadcrumbs?: Array<{ title?: string; link?: string; current?: number }> } | null;
    };
  } | null)?.pageData?.value?.breadcrumbs;

  return Array.isArray(items) ? items : [];
});
</script>

<template>
  <section class="pb-12 lg:pb-20">
    <UContainer>
      <nav
        v-if="breadcrumbs.length > 0"
        aria-label="Breadcrumb"
        class="mb-8 text-sm text-black/70"
      >
        <ol class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li
            v-for="(item, index) in breadcrumbs"
            :key="`${item.link || item.title || index}`"
            class="inline-flex items-center gap-2"
          >
            <NuxtLink
              v-if="item.current !== 1 && item.link"
              :to="item.link"
              class="hover:underline"
            >
              {{ item.title }}
            </NuxtLink>
            <span v-else class="font-semibold text-black">{{ item.title }}</span>
            <span v-if="index < breadcrumbs.length - 1" aria-hidden="true">/</span>
          </li>
        </ol>
      </nav>

      <p v-if="formattedDate" class="mb-6 text-sm uppercase tracking-wide text-black/70">
        {{ formattedDate }}
      </p>

      <figure v-if="imageUrl" class="mb-8 overflow-hidden rounded-sm">
        <img
          :src="imageUrl"
          :alt="imageAlt"
          class="h-auto w-full object-cover"
          loading="lazy"
          decoding="async"
        >
        <figcaption v-if="imageDescription" class="mt-3 text-sm italic text-black/70">
          {{ imageDescription }}
        </figcaption>
      </figure>

      <div v-if="resolvedDetail?.bodytext" class="rte-content">
        <T3HtmlParser :content="resolvedDetail.bodytext" />
      </div>

      <div v-if="nestedContentElements.length > 0" class="mt-10">
        <T3Renderer :content="nestedContentElements" />
      </div>

      <div class="mt-10 border-t border-black/15 pt-6">
        <NuxtLink to="/news" class="font-semibold text-primary hover:underline">
          {{ backLinkLabel }}
        </NuxtLink>
      </div>
    </UContainer>
  </section>
</template>
