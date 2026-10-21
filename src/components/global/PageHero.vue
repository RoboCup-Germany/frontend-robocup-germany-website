<script setup lang="ts">
import { NuxtPicture } from '#components';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import Button from '~/components/basic/Button.vue';
import { toDisplayImage } from '~/utils/media-image';

interface MediaItem {
  publicUrl?: string | null;
  url?: string | null;
  originalUrl?: string | null;
  mimeType?: string | null;
  type?: string | null;
  alt?: string | null;
  alternative?: string | null;
  description?: string | null;
  title?: string | null;
  properties?: {
    title?: string | null;
    alternative?: string | null;
    description?: string | null;
    originalUrl?: string | null;
    mimeType?: string | null;
    type?: string | null;
  } | null;
  content?: {
    publicUrl?: string | null;
    url?: string | null;
    originalUrl?: string | null;
    mimeType?: string | null;
    properties?: {
      originalUrl?: string | null;
      mimeType?: string | null;
    } | null;
  } | null;
  cropVariants?: {
    default?: { publicUrl?: string | null; url?: string | null } | null;
    small?: { publicUrl?: string | null; url?: string | null } | null;
  } | null;
}

interface Props {
  title?: string;
  subtitle?: string;
  media?: unknown;
  mediaButtonText?: string;
  mediaButtonLink?: LinkRef | null;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  media: null,
  mediaButtonText: '',
  mediaButtonLink: null
});

const toUrl = (value?: string | null): string => value?.trim() || '';

const mediaItem = computed<MediaItem | null>(() => {
  const value = props.media;
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value.find((item) => item && typeof item === 'object') as MediaItem | undefined) || null;
  }
  if (typeof value === 'object') {
    return value as MediaItem;
  }
  return null;
});

const mediaDisplay = computed(() => toDisplayImage(mediaItem.value));
const mediaSource = computed(() => mediaItem.value?.content || mediaItem.value || null);

// An additional image next to a hero video is used as its poster (LCP candidate and mobile fallback).
const posterItem = computed<MediaItem | null>(() => {
  if (!Array.isArray(props.media)) return null;
  const items = props.media.filter((item): item is MediaItem => Boolean(item) && typeof item === 'object');
  return items.find((item) => item !== mediaItem.value && isImageMediaItem(item)) || null;
});
const posterDisplay = computed(() => toDisplayImage(posterItem.value));

const imageDesktopUrl = computed(() => {
  return toUrl(mediaDisplay.value?.urlDefault);
});

const imageMobileUrl = computed(() => {
  return toUrl(mediaDisplay.value?.urlSmall || mediaDisplay.value?.urlDefault);
});

const imageDesktopSrcset = computed(() => {
  return toUrl(mediaDisplay.value?.srcsetDefault);
});

const imageMobileSrcset = computed(() => {
  return toUrl(mediaDisplay.value?.srcsetSmall);
});

const imageAlt = computed(() => {
  return mediaDisplay.value?.alt || props.title || 'Seitenbild';
});
const imageWidth = computed(() => mediaDisplay.value?.width || undefined);
const imageHeight = computed(() => mediaDisplay.value?.height || undefined);

const imageMobileDisplayUrl = computed(() => imageMobileUrl.value || imageDesktopUrl.value);
const imageDesktopDisplayUrl = computed(() => imageDesktopUrl.value || imageMobileUrl.value);
const videoDefaultUrl = computed(() => {
  const media = mediaSource.value;
  if (!media) return '';
  return toUrl(media.publicUrl || media.url || media.originalUrl || media.properties?.originalUrl);
});

const videoMobileUrl = computed(() => {
  if (isVideoUrl(imageMobileDisplayUrl.value)) {
    return imageMobileDisplayUrl.value;
  }
  return videoDefaultUrl.value;
});

const videoDesktopUrl = computed(() => {
  if (isVideoUrl(imageDesktopDisplayUrl.value)) {
    return imageDesktopDisplayUrl.value;
  }
  return videoDefaultUrl.value;
});

const videoFallbackUrl = computed(() => {
  return videoDesktopUrl.value || videoMobileUrl.value || videoDefaultUrl.value;
});

const posterDesktopUrl = computed(() => {
  const poster = posterDisplay.value;
  if (poster) return toUrl(poster.urlDefault || poster.urlSmall);
  if (imageDesktopDisplayUrl.value && !isVideoUrl(imageDesktopDisplayUrl.value)) {
    return imageDesktopDisplayUrl.value;
  }
  return '';
});

const posterMobileUrl = computed(() => {
  const poster = posterDisplay.value;
  if (poster) return toUrl(poster.urlSmall || poster.urlDefault);
  if (imageMobileDisplayUrl.value && !isVideoUrl(imageMobileDisplayUrl.value)) {
    return imageMobileDisplayUrl.value;
  }
  return posterDesktopUrl.value;
});

const posterDesktopSrcset = computed(() => toUrl(posterDisplay.value?.srcsetDefault));
const posterMobileSrcset = computed(() => toUrl(posterDisplay.value?.srcsetSmall) || posterMobileUrl.value);
const hasPoster = computed(() => Boolean(posterDesktopUrl.value || posterMobileUrl.value));

const mediaMimeType = computed(() => {
  const media = mediaSource.value;
  if (!media) return '';
  return toUrl(media.mimeType || media.properties?.mimeType).toLowerCase();
});

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);

function isImageMediaItem(item: MediaItem): boolean {
  const source = item.content || item;
  const mimeType = toUrl(source.mimeType || source.properties?.mimeType || item.type).toLowerCase();
  if (mimeType.startsWith('image')) return true;
  if (mimeType.startsWith('video')) return false;
  const url = toUrl(source.publicUrl || source.url || source.originalUrl);
  return Boolean(url) && !isVideoUrl(url);
}

const mediaIsVideo = computed(() => {
  return Boolean(
    isVideoUrl(videoDefaultUrl.value)
    || isVideoUrl(imageMobileDisplayUrl.value)
    || isVideoUrl(imageDesktopDisplayUrl.value)
    || mediaMimeType.value.startsWith('video/')
  );
});

const mediaIsImage = computed(() => {
  if (mediaIsVideo.value) return false;
  if (imageMobileDisplayUrl.value || imageDesktopDisplayUrl.value) {
    return true;
  }
  return mediaMimeType.value.startsWith('image/');
});

const hasImage = computed(() => Boolean(imageMobileUrl.value || imageDesktopUrl.value));
const hasVideo = computed(() => Boolean(videoDefaultUrl.value || videoMobileUrl.value || videoDesktopUrl.value));
const hasImageSources = computed(() => Boolean(imageMobileDisplayUrl.value || imageDesktopDisplayUrl.value));
const videoElement = ref<HTMLVideoElement | null>(null);
const videoPlaybackFailed = ref(false);

type VideoSource = { src: string; type?: string };

const typeFromVideoUrl = (source: string): string | undefined => {
  if (/\.mp4(\?|#|$)/i.test(source)) return 'video/mp4';
  if (/\.m4v(\?|#|$)/i.test(source)) return 'video/mp4';
  if (/\.webm(\?|#|$)/i.test(source)) return 'video/webm';
  if (/\.ogg(\?|#|$)/i.test(source)) return 'video/ogg';
  if (/\.mov(\?|#|$)/i.test(source)) return 'video/quicktime';
  return undefined;
};

const videoSources = computed<VideoSource[]>(() => {
  const urls = Array.from(
    new Set([
      videoMobileUrl.value,
      videoDesktopUrl.value,
      videoFallbackUrl.value
    ].filter((value): value is string => Boolean(value)))
  );

  const fallbackType = mediaMimeType.value.startsWith('video/') ? mediaMimeType.value : undefined;
  const sources = urls.map((src) => ({
    src,
    type: typeFromVideoUrl(src) || fallbackType
  }));

  // Safari tends to behave more reliably with MP4 as first candidate.
  sources.sort((a, b) => {
    const aScore = a.type === 'video/mp4' ? 0 : 1;
    const bScore = b.type === 'video/mp4' ? 0 : 1;
    return aScore - bScore;
  });

  return sources;
});

const canPlayVideo = computed(() => mediaIsVideo.value && hasVideo.value && !videoPlaybackFailed.value);
// Sources are only attached after the page has loaded, so the video never competes with critical resources.
const videoActivated = ref(false);
const videoPlaying = ref(false);

const markVideoAsFailed = () => {
  videoPlaybackFailed.value = true;
};

const markVideoAsPlaying = () => {
  videoPlaying.value = true;
};

// Mobile, data saver and reduced motion get the poster only, as long as there is one to show.
const shouldSkipVideo = (): boolean => {
  if (!hasPoster.value) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData)
    || window.matchMedia('(max-width: 767px)').matches
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const afterPageLoad = (callback: () => void) => {
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 200);
    }
  };
  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
};

const tryStartVideo = async () => {
  if (!import.meta.client || !canPlayVideo.value || !videoActivated.value) return;
  const element = videoElement.value;
  if (!element) return;

  element.muted = true;
  element.defaultMuted = true;
  element.load();

  try {
    await element.play();
  } catch {
    markVideoAsFailed();
  }
};

const activateVideo = () => {
  if (!import.meta.client || !mediaIsVideo.value || shouldSkipVideo()) return;
  afterPageLoad(() => {
    videoActivated.value = true;
    nextTick(() => {
      void tryStartVideo();
    });
  });
};
const hasVisual = computed(() => {
  if (mediaIsVideo.value) return hasVideo.value || hasImageSources.value;
  return hasImage.value;
});
const hasHeadline = computed(() => Boolean(props.title || props.subtitle));
const hasHero = computed(() => hasVisual.value || hasHeadline.value);
const hasMediaButton = computed(() => {
  const label = props.mediaButtonText?.trim();
  const href = props.mediaButtonLink?.url || props.mediaButtonLink?.attr?.href;
  return Boolean(label && href);
});

onMounted(() => {
  activateVideo();
});

watch(
  () => `${mediaIsVideo.value}-${videoSources.value.map((item) => item.src).join('|')}`,
  () => {
    videoPlaybackFailed.value = false;
    videoActivated.value = false;
    videoPlaying.value = false;
    activateVideo();
  }
);
</script>

<template>
  <section v-if="hasHero" class="relative w-full overflow-hidden">
    <template v-if="hasVisual">
      <div class="relative">
        <div class="relative h-[clamp(260px,56vw,680px)] w-full overflow-hidden md:h-[clamp(320px,50vw,760px)]">
        <template v-if="mediaIsVideo">
          <picture
            v-if="hasPoster"
            class="absolute inset-0 block h-full w-full"
          >
            <source
              v-if="posterMobileSrcset"
              media="(max-width: 767px)"
              :srcset="posterMobileSrcset"
            >
            <img
              :src="posterDesktopUrl || posterMobileUrl"
              :srcset="posterDesktopSrcset || undefined"
              alt=""
              aria-hidden="true"
              sizes="100vw"
              class="h-full w-full object-cover"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            >
          </picture>
          <video
            v-if="canPlayVideo"
            ref="videoElement"
            muted
            playsinline
            webkit-playsinline
            loop
            preload="none"
            aria-hidden="true"
            tabindex="-1"
            role="presentation"
            class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            :class="hasPoster && !videoPlaying ? 'opacity-0' : 'opacity-100'"
            @playing="markVideoAsPlaying"
            @error="markVideoAsFailed"
          >
            <template v-if="videoActivated">
              <source
                v-for="source in videoSources"
                :key="source.src"
                :src="source.src"
                :type="source.type"
              />
            </template>
          </video>
        </template>
        <picture
          v-else-if="imageDesktopSrcset || imageMobileSrcset"
          class="absolute inset-0 block h-full w-full"
        >
          <source
            v-if="imageMobileSrcset"
            media="(max-width: 767px)"
            :srcset="imageMobileSrcset"
          >
          <img
            :src="imageDesktopDisplayUrl || imageMobileDisplayUrl"
            :srcset="imageDesktopSrcset || undefined"
            :alt="imageAlt"
            :width="imageWidth"
            :height="imageHeight"
            sizes="100vw"
            class="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          >
        </picture>
        <picture
          v-else-if="hasImageSources"
          class="absolute inset-0 block h-full w-full"
        >
          <source
            v-if="imageMobileDisplayUrl"
            media="(max-width: 767px)"
            :srcset="imageMobileDisplayUrl"
          >
          <img
            :src="imageDesktopDisplayUrl || imageMobileDisplayUrl"
            :alt="imageAlt"
            :width="imageWidth"
            :height="imageHeight"
            class="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          >
        </picture>
        </div>

        <div
          aria-hidden="true"
          role="presentation"
          class="pointer-events-none absolute left-1/2 bottom-0 z-30 w-[180vw] h-[110vw] -translate-x-1/2 translate-y-[89%] rounded-[999px] bg-white md:w-[140vw] md:h-[80vw] lg:w-[125vw] lg:h-[38vw] 3xl:translate-y-[95%]"
        />

        <div
          v-if="hasMediaButton"
          class="absolute left-1/2 bottom-6 z-40 -translate-x-1/2 px-4 md:bottom-8"
        >
          <Button
            :to="mediaButtonLink"
            :label="mediaButtonText"
            class="w-full justify-center"
          />
        </div>
      </div>

      <UContainer v-if="hasHeadline" class="relative z-40 bg-white py-5 lg:py-8">
        <PageBreadcrumb />
        <h1 v-if="title" class="mb-1">{{ title }}</h1>
        <p v-if="subtitle" class="mt-0 text-base md:text-lg font-bold italic tracking-wide text-black/90">{{ subtitle }}</p>
      </UContainer>
    </template>

    <template v-else>
      <UContainer class="py-5 lg:py-8">
        <PageBreadcrumb />
        <h1 v-if="title" class="mb-1">{{ title }}</h1>
        <p v-if="subtitle" class="mt-0 text-base md:text-lg font-bold italic tracking-wide text-black/90">{{ subtitle }}</p>
      </UContainer>
    </template>
  </section>
</template>
