<script setup lang="ts">
import { computed } from 'vue';

const requestUrl = useRequestURL();
const safeFullPath = `${requestUrl.pathname}${requestUrl.search || ''}` || '/';
const nuxtRoute = useRoute();
const route = (
  nuxtRoute && typeof nuxtRoute.fullPath === 'string'
    ? nuxtRoute
    : { fullPath: safeFullPath, query: {} }
) as ReturnType<typeof useRoute>;

const { headData, pageData, backendLayout } = await useT3Page({
  route,
  fetchOnInit: true
})
const { initialData } = useT3Api()
useHead(headData);

interface AnnouncementButton {
  text?: string;
  link?: string;
  color?: 'main' | 'primary' | 'junior' | 'major' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  type?: 'full' | 'outline' | 'solid';
}

interface AnnouncementBar {
  title?: string;
  description?: string;
  buttons?: AnnouncementButton[];
  selectedPageUids?: Array<number | string>;
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
};

const parseUid = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toUidSet = (values: unknown[]): Set<number> => {
  const set = new Set<number>();
  values.forEach((value) => {
    const parsed = parseUid(value);
    if (parsed !== null) {
      set.add(parsed);
    }
  });
  return set;
};

type NewsDetailRecord = {
  title?: string;
  teaser?: string;
};

const findNewsDetail = (input: unknown): NewsDetailRecord | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const source = input as { content?: Record<string, unknown[]> };
  const content = source.content;
  if (!content || typeof content !== 'object') {
    return null;
  }

  for (const colElements of Object.values(content)) {
    if (!Array.isArray(colElements)) continue;
    const newsDetailElement = colElements.find((item) => {
      if (!item || typeof item !== 'object') return false;
      return (item as { type?: string }).type === 'news_newsdetail';
    });

    if (!newsDetailElement || typeof newsDetailElement !== 'object') {
      continue;
    }

    const detail = (newsDetailElement as {
      content?: { data?: { detail?: NewsDetailRecord } };
    }).content?.data?.detail;

    if (detail && typeof detail === 'object') {
      return detail;
    }
  }

  return null;
};

const newsDetail = computed(() => findNewsDetail(pageData.value));

const pageTitle = computed(() => {
  const pageRecord = asRecord(pageData.value);
  const metaRecord = asRecord(pageRecord?.meta);

  return parseString(newsDetail.value?.title)
    || parseString(metaRecord?.title)
    || parseString(pageRecord?.title)
    || '';
});

const pageSubtitle = computed(() => {
  const pageRecord = asRecord(pageData.value);
  const metaRecord = asRecord(pageRecord?.meta);

  return parseString(newsDetail.value?.teaser)
    || parseString(metaRecord?.subtitle)
    || parseString(pageRecord?.subtitle)
    || '';
});

const pageMedia = computed(() => {
  const media = (pageData.value as { media?: unknown } | null)?.media;
  return media ?? null;
});

const parseString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const mediaButtonText = computed(() => {
  const source = pageData.value as {
    mediaButtonText?: unknown;
    media_button_text?: unknown;
  } | null;

  return parseString(source?.mediaButtonText) || parseString(source?.media_button_text);
});

const rawMediaButtonLink = computed(() => {
  const source = pageData.value as {
    mediaButton?: unknown;
    media_button?: unknown;
  } | null;

  return parseString(source?.mediaButton) || parseString(source?.media_button);
});

const extractT3PageUid = (value?: string): number | null => {
  if (!value) return null;
  const match = value.trim().match(/^t3:\/\/page\?(.+)$/i);
  if (!match) return null;

  const params = new URLSearchParams(match[1]);
  const uid = Number(params.get('uid'));
  return Number.isFinite(uid) ? uid : null;
};

const mediaButtonT3Uid = computed(() => extractT3PageUid(rawMediaButtonLink.value));

const { data: resolvedMediaButtonLink } = await useAsyncData<string>(
  () => `page-hero-media-button-link:${mediaButtonT3Uid.value ?? 'none'}:${rawMediaButtonLink.value || 'empty'}`,
  async () => {
    const rawLink = rawMediaButtonLink.value;
    const uid = mediaButtonT3Uid.value;

    if (!rawLink) {
      return '';
    }

    if (uid === null) {
      return rawLink;
    }

    try {
      const page = await $fetch<{ slug?: string }>('/api/typo3/', {
        query: { id: uid }
      });
      const slug = typeof page?.slug === 'string' ? page.slug.trim() : '';
      return slug || '/';
    }
    catch {
      return '/';
    }
  },
  { default: () => '' }
);

const mediaButtonLink = computed<LinkRef | null>(() => {
  const label = mediaButtonText.value;
  const url = resolvedMediaButtonLink.value?.trim() || '';

  if (!label || !url) {
    return null;
  }

  return {
    url
  };
});

const currentPageUids = computed(() => {
  const source = pageData.value as {
    uid?: unknown;
    id?: unknown;
    page?: { uid?: unknown; id?: unknown };
    meta?: { uid?: unknown; id?: unknown; page?: { uid?: unknown; id?: unknown } };
  } | null;

  return toUidSet([
    source?.uid,
    source?.id,
    source?.page?.uid,
    source?.page?.id,
    source?.meta?.uid,
    source?.meta?.id,
    source?.meta?.page?.uid,
    source?.meta?.page?.id
  ]);
});

const announcementBars = computed<AnnouncementBar[]>(() => {
  const initialGlobalConfig = asRecord(initialData.value?.globalConfig);
  const fromInitial = Array.isArray(initialGlobalConfig?.announcementBars)
    ? initialGlobalConfig.announcementBars as AnnouncementBar[]
    : [];
  if (fromInitial.length) {
    return fromInitial;
  }

  const source = asRecord(pageData.value);
  const sourceGlobalConfig = asRecord(source?.globalConfig);
  const sourceMeta = asRecord(source?.meta);
  const sourceMetaGlobalConfig = asRecord(sourceMeta?.globalConfig);

  if (Array.isArray(sourceGlobalConfig?.announcementBars)) {
    return sourceGlobalConfig.announcementBars as AnnouncementBar[];
  }

  if (Array.isArray(sourceMetaGlobalConfig?.announcementBars)) {
    return sourceMetaGlobalConfig.announcementBars as AnnouncementBar[];
  }

  return [];
});

const matchingAnnouncement = computed<AnnouncementBar | null>(() => {
  const pageUids = currentPageUids.value;
  if (!pageUids.size) {
    return null;
  }

  return announcementBars.value.find((bar) => {
    const barRecord = asRecord(bar);
    if (!barRecord) {
      return false;
    }

    const selected = Array.isArray(barRecord.selectedPageUids) ? barRecord.selectedPageUids : [];
    return selected.some((uid) => {
      const parsed = parseUid(uid);
      return parsed !== null && pageUids.has(parsed);
    });
  }) || null;
});

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <PageAnnouncementBar
    v-if="matchingAnnouncement"
    :announcement="matchingAnnouncement"
  />
  <PageHero
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :media="pageMedia"
    :media-button-text="mediaButtonText"
    :media-button-link="mediaButtonLink"
  />
  <T3BackendLayout
      :key="route.fullPath"
      v-if="pageData?.content"
      :name="backendLayout"
      :content="pageData.content"
  />
</template>

<style scoped>

</style>
