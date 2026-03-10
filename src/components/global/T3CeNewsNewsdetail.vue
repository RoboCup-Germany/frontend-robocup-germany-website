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

type SocialChannel =
  | 'instagram'
  | 'youtube'
  | 'flickr'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'whatsapp'
  | 'bluesky';

type SocialUrls = Partial<Record<SocialChannel, string>>;

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

const { initialData, pageData } = useT3Api();
const route = useRoute();

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
const isEnglishRoute = computed(() => route.path.startsWith('/en'));

const downloadUrl = computed(() => {
  const query = new URLSearchParams();

  Object.entries(route.query).forEach(([key, value]) => {
    if (key === 'download' || key === 'print') {
      return;
    }

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

  query.set('download', '1');
  query.set('print', '1');

  const search = query.toString();
  return search ? `${route.path}?${search}` : route.path;
});

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

const downloadLabel = computed(() => {
  return isEnglishRoute.value
    ? 'Save/print press release'
    : 'Pressemitteilung speichern/drucken';
});

const socialChannelConfig: Array<{ key: SocialChannel; label: string; icon: string }> = [
  { key: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { key: 'youtube', label: 'YouTube', icon: 'i-simple-icons-youtube' },
  { key: 'flickr', label: 'Flickr', icon: 'i-simple-icons-flickr' },
  { key: 'tiktok', label: 'TikTok', icon: 'i-simple-icons-tiktok' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  { key: 'twitter', label: 'Twitter', icon: 'i-simple-icons-twitter' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'i-simple-icons-whatsapp' },
  { key: 'bluesky', label: 'Bluesky', icon: 'i-simple-icons-bluesky' }
];

const socialUrls = computed<SocialUrls>(() => {
  type GlobalConfigSocials = { socials?: SocialUrls; socialUrls?: SocialUrls };

  const pageGlobalConfig = pageData.value?.globalConfig as GlobalConfigSocials | undefined;
  const initialGlobalConfig = initialData.value?.globalConfig as GlobalConfigSocials | undefined;

  return (
    pageGlobalConfig?.socials
    ?? pageGlobalConfig?.socialUrls
    ?? initialGlobalConfig?.socials
    ?? initialGlobalConfig?.socialUrls
    ?? {}
  );
});

const socialLinks = computed(() => {
  return socialChannelConfig
    .map((channel) => {
      const href = socialUrls.value[channel.key]?.trim();
      if (!href) return null;
      return { ...channel, href };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});

</script>

<template>
  <section class="pb-12 lg:pb-20">
    <UContainer>
      <header v-if="isDownloadView && resolvedDetail" class="mb-8 border-b border-black/15 pb-6">
        <h1 v-if="resolvedDetail.title" class="text-3xl font-bold tracking-tight text-black lg:text-5xl">
          {{ resolvedDetail.title }}
        </h1>
        <p v-if="resolvedDetail.teaser" class="mt-4 text-lg leading-relaxed text-black/75">
          {{ resolvedDetail.teaser }}
        </p>
      </header>

      <p v-if="formattedDate" class="mb-6 text-sm uppercase tracking-wide text-black/70">
        {{ formattedDate }}
      </p>

      <figure v-if="imageUrl" class="mb-8 overflow-hidden rounded-sm">
        <NuxtPicture
          provider="ipx"
          :src="imageUrl"
          :alt="imageAlt"
          class="block w-full"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          sizes="100vw"
          format="avif,webp"
          legacy-format="jpeg"
          :quality="80"
          :img-attrs="{ class: 'h-auto w-full object-cover' }"
        />
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

      <div v-if="!isDownloadView" class="mt-10 border-t border-black/15 pt-6">
        <div class="flex flex-wrap items-center justify-start gap-x-6 gap-y-4">
          <NuxtLink to="/news" class="font-semibold text-primary hover:underline">
            {{ backLinkLabel }}
          </NuxtLink>

          <a
            :href="downloadUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center rounded-sm border-2 border-primary px-5 py-3 font-semibold text-primary transition hover:bg-primary/5"
          >
            {{ downloadLabel }}
          </a>

          <div v-if="socialLinks.length" class="flex flex-wrap items-center justify-start gap-2">
            <a
              v-for="channel in socialLinks"
              :key="channel.key"
              :href="channel.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${channel.label} öffnen`"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
            >
              <UIcon :name="channel.icon" class="h-4 w-4" />
              <span class="sr-only">{{ channel.label }}</span>
            </a>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
