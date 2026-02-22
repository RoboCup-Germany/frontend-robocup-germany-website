<script setup lang="ts">
import { computed } from 'vue';

const { headData, pageData, backendLayout, getPageData } = await useT3Page()
const { initialData } = useT3Api()
const route = useRoute()
useHead(headData);
watch(() => route.fullPath, getPageData)

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
  return newsDetail.value?.title?.trim()
    || pageData.value?.meta?.title?.trim()
    || (pageData.value as { title?: string } | null)?.title?.trim()
    || '';
});

const pageSubtitle = computed(() => {
  return newsDetail.value?.teaser?.trim()
    || pageData.value?.meta?.subtitle?.trim()
    || (pageData.value as { subtitle?: string } | null)?.subtitle?.trim()
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
  const fromInitial = (initialData.value?.globalConfig?.announcementBars as AnnouncementBar[] | undefined) ?? [];
  if (fromInitial.length) {
    return fromInitial;
  }

  const source = pageData.value as {
    globalConfig?: { announcementBars?: AnnouncementBar[] };
    meta?: { globalConfig?: { announcementBars?: AnnouncementBar[] } };
  } | null;

  return (
    source?.globalConfig?.announcementBars
    ?? source?.meta?.globalConfig?.announcementBars
    ?? []
  );
});

const matchingAnnouncement = computed<AnnouncementBar | null>(() => {
  const pageUids = currentPageUids.value;
  if (!pageUids.size) {
    return null;
  }

  return announcementBars.value.find((bar) => {
    const selected = Array.isArray(bar.selectedPageUids) ? bar.selectedPageUids : [];
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
