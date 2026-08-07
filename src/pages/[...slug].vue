<script setup lang="ts">
import { computed, nextTick, onMounted, unref, watchEffect } from 'vue';
import { resolveThemeFromTypo3SitePayload, type ResolvedSiteConfig } from '~/utils/site-config';

const requestUrl = useRequestURL();
const safeFullPath = `${requestUrl.pathname}${requestUrl.search || ''}` || '/';
const nuxtRoute = useRoute();
const route = (
  nuxtRoute && typeof nuxtRoute.fullPath === 'string'
    ? nuxtRoute
    : { fullPath: safeFullPath, query: {} }
) as ReturnType<typeof useRoute>;

const queryFlagEnabled = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(queryFlagEnabled);
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  return value === 1 || value === true;
};

const isDownloadView = computed(() => queryFlagEnabled(route.query.download));
const shouldAutoPrint = computed(() => queryFlagEnabled(route.query.print));

const cmsQuery = computed(() => {
  const query = { ...(route.query || {}) } as Record<string, unknown>;
  delete query.download;
  delete query.print;
  return query;
});

const cmsFullPath = computed(() => {
  const query = new URLSearchParams();

  Object.entries(cmsQuery.value).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null) {
          query.append(key, String(entry));
        }
      });
      return;
    }

    if (value != null) {
      query.set(key, String(value));
    }
  });

  const search = query.toString();
  return search ? `${route.path}?${search}` : route.path;
});

const cmsRoute = computed(() => ({
  ...route,
  fullPath: cmsFullPath.value,
  query: cmsQuery.value
}));

const { headData, pageData, backendLayout } = await useT3Page({
  route: cmsRoute.value,
  fetchOnInit: true
})
const { initialData } = useT3Api()
const { normalize } = useCmsLink();

const activeSite = useState<ResolvedSiteConfig | null>('active-site', () => null);
const siteGlobalConfig = useState<GlobalConfig | null>('site-global-config', () => null);
const siteHeaderLogo = useState<{ src: string; alt?: string } | null>('site-header-logo', () => null);
const siteFooterLogo = useState<{ src: string; alt?: string } | null>('site-footer-logo', () => null);
const resolvedTheme = computed(() => resolveThemeFromTypo3SitePayload(
  pageData.value,
  activeSite.value?.theme || 'default'
));

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
};

const asTrimmedString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const getFrontendBase = (): string => {
  const pageRecord = asRecord(pageData.value);
  const siteRecord = asRecord(pageRecord?.site);
  const frontendBase = asTrimmedString(siteRecord?.frontendBase);

  return frontendBase || requestUrl.origin;
};

const toFrontendAbsoluteUrl = (value: unknown): string | undefined => {
  const href = asTrimmedString(value);
  if (!href) {
    return undefined;
  }

  try {
    const parsed = new URL(href, getFrontendBase());
    const prefixPath = activeSite.value?.typo3PathPrefix?.replace(/\/+$/, '');
    if (prefixPath && prefixPath !== '/') {
      if (parsed.pathname === prefixPath) {
        parsed.pathname = '/';
      } else if (parsed.pathname.startsWith(`${prefixPath}/`)) {
        parsed.pathname = parsed.pathname.slice(prefixPath.length) || '/';
      }
    }

    return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, getFrontendBase()).toString();
  }
  catch {
    return normalize(href) || href;
  }
};

const getPayloadSeoLinks = (): unknown[] => {
  const pageRecord = asRecord(pageData.value);
  const seoRecord = asRecord(pageRecord?.seo);

  return Array.isArray(seoRecord?.link) ? seoRecord.link : [];
};

type NewsDetailRecord = {
  title?: string;
  subtitle?: string;
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

const parseString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const newsDetailSubtitle = computed(() => {
  return parseString(newsDetail.value?.subtitle)
    || parseString(newsDetail.value?.teaser);
});

const newsDetailSocialMetaKeys = new Set([
  'description',
  'og:title',
  'ogtitle',
  'og:description',
  'ogdescription',
  'twitter:title',
  'twittertitle',
  'twitter:description',
  'twitterdescription',
  'twitter:card',
  'twittercard'
]);

const shouldRemoveNewsDetailMeta = (meta: unknown): boolean => {
  if (!newsDetail.value) {
    return false;
  }

  const metaRecord = asRecord(meta);
  if (!metaRecord) {
    return false;
  }

  const identifier = (
    asTrimmedString(metaRecord.property)
    || asTrimmedString(metaRecord.name)
    || asTrimmedString(metaRecord.hid)
    || asTrimmedString(metaRecord.key)
  ).toLowerCase();

  return newsDetailSocialMetaKeys.has(identifier);
};

const normalizedHeadData = computed(() => {
  const source = unref(headData) as Record<string, unknown> | null | undefined;
  if (!source) {
    return source;
  }

  const sourceLinks = Array.isArray(source.link) ? source.link : [];
  const rawLinks = sourceLinks.length ? sourceLinks : getPayloadSeoLinks();
  const links = rawLinks.length
    ? rawLinks.map((link) => {
      const linkRecord = asRecord(link);
      if (!linkRecord) {
        return link;
      }

      const rel = asTrimmedString(linkRecord.rel).toLowerCase();
      if (rel !== 'canonical' && rel !== 'alternate') {
        return link;
      }

      const href = toFrontendAbsoluteUrl(linkRecord.href);
      return href ? { ...linkRecord, href } : link;
    })
    : source.link;
  const sourceMeta = Array.isArray(source.meta) ? source.meta : [];
  const meta = sourceMeta.length && newsDetail.value
    ? sourceMeta.filter((item) => !shouldRemoveNewsDetailMeta(item))
    : source.meta;

  return {
    ...source,
    link: links,
    meta
  };
});

useHead(normalizedHeadData);

const resolvePayloadLogo = (value: unknown): { src: string; alt?: string } | null => {
  const file = asRecord(value);
  if (!file) {
    return null;
  }

  const src = asTrimmedString(file.publicUrl) || asTrimmedString(file.url) || asTrimmedString(file.originalUrl);
  if (!src) {
    return null;
  }

  const alt = asTrimmedString(file.alt) || asTrimmedString(file.alternative);
  return alt ? { src, alt } : { src };
};

watchEffect(() => {
  if (!activeSite.value) {
    return;
  }

  activeSite.value = {
    ...activeSite.value,
    theme: resolvedTheme.value
  };
});

watchEffect(() => {
  const globalConfig = pageData.value?.globalConfig ?? initialData.value?.globalConfig;
  if (globalConfig) {
    siteGlobalConfig.value = globalConfig as GlobalConfig;
    siteHeaderLogo.value = resolvePayloadLogo((globalConfig as GlobalConfig).siteConfig?.headerLogo);
    siteFooterLogo.value = resolvePayloadLogo((globalConfig as GlobalConfig).siteConfig?.footerLogo);
  }
});

useHead(() => ({
  htmlAttrs: {
    'data-theme': resolvedTheme.value
  }
}));

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

  return newsDetailSubtitle.value
    || parseString(metaRecord?.subtitle)
    || parseString(pageRecord?.subtitle)
    || '';
});

const pageDescription = computed(() => {
  const pageRecord = asRecord(pageData.value);
  const metaRecord = asRecord(pageRecord?.meta);
  const seoRecord = asRecord(pageRecord?.seo);

  return newsDetailSubtitle.value
    || parseString(seoRecord?.description)
    || parseString(metaRecord?.description)
    || parseString(metaRecord?.subtitle)
    || parseString(pageRecord?.subtitle)
    || parseString(pageRecord?.description)
    || parseString(pageRecord?.title)
    || 'RoboCup Germany: Informationen zu Events, Ligen, Workshops und News rund um Robotik-Wettbewerbe in Deutschland.';
});

useSeoMeta({
  title: () => pageTitle.value || 'RoboCup Germany',
  ogTitle: () => pageTitle.value || 'RoboCup Germany',
  description: () => pageDescription.value,
  ogDescription: () => pageDescription.value,
  twitterTitle: () => pageTitle.value || 'RoboCup Germany',
  twitterDescription: () => pageDescription.value,
  twitterCard: 'summary_large_image'
});

const pageMedia = computed(() => {
  const media = (pageData.value as { media?: unknown } | null)?.media;
  return media ?? null;
});

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

onMounted(async () => {
  if (!isDownloadView.value || !shouldAutoPrint.value) {
    return;
  }

  await nextTick();
  window.print();
});
</script>

<template>
  <PageAnnouncementBar
    v-if="matchingAnnouncement && !isDownloadView"
    :announcement="matchingAnnouncement"
  />
  <PageHero
    v-if="!isDownloadView"
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
