<script setup lang="ts">
import { computed } from 'vue';
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

const imageDesktopUrl = computed(() => {
  return toUrl(mediaDisplay.value?.urlDefault);
});

const imageMobileUrl = computed(() => {
  return toUrl(mediaDisplay.value?.urlSmall || mediaDisplay.value?.urlDefault);
});

const imageAlt = computed(() => {
  return mediaDisplay.value?.alt || props.title || 'Seitenbild';
});

const imageMobileDisplayUrl = computed(() => imageMobileUrl.value || imageDesktopUrl.value);
const imageDesktopDisplayUrl = computed(() => imageDesktopUrl.value || imageMobileUrl.value);
const videoDisplayUrl = computed(() => imageDesktopDisplayUrl.value || imageMobileDisplayUrl.value);

const mediaMimeType = computed(() => {
  const media = mediaItem.value;
  if (!media) return '';
  return toUrl(media.mimeType || media.properties?.mimeType).toLowerCase();
});

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);

const mediaIsVideo = computed(() => {
  return Boolean(
    isVideoUrl(imageMobileDisplayUrl.value)
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
const hasHeadline = computed(() => Boolean(props.title || props.subtitle));
const hasHero = computed(() => hasImage.value || hasHeadline.value);
const hasMediaButton = computed(() => {
  const label = props.mediaButtonText?.trim();
  const href = props.mediaButtonLink?.url || props.mediaButtonLink?.attr?.href;
  return Boolean(label && href);
});
</script>

<template>
  <section v-if="hasHero" class="relative w-full overflow-hidden">
    <template v-if="hasImage">
      <div class="relative">
        <video
          v-if="videoDisplayUrl && mediaIsVideo"
          :src="videoDisplayUrl"
          autoplay
          muted
          playsinline
          loop
          preload="metadata"
          aria-hidden="true"
          tabindex="-1"
          role="presentation"
          class="block w-full aspect-square min-h-[100vw] object-cover md:hidden"
        />
        <NuxtImg
          v-else-if="imageMobileDisplayUrl && mediaIsImage"
          :src="imageMobileDisplayUrl"
          :alt="imageAlt"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          sizes="100vw"
          format="webp"
          :quality="80"
          class="block w-full aspect-square object-cover md:hidden"
        />
        <video
          v-if="videoDisplayUrl && mediaIsVideo"
          :src="videoDisplayUrl"
          autoplay
          muted
          playsinline
          loop
          preload="metadata"
          aria-hidden="true"
          tabindex="-1"
          role="presentation"
          class="hidden w-full h-auto max-h-[68vh] object-cover md:block"
        />
        <NuxtImg
          v-else-if="imageDesktopDisplayUrl && mediaIsImage"
          :src="imageDesktopDisplayUrl"
          :alt="imageAlt"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          sizes="100vw"
          format="webp"
          :quality="80"
          class="hidden w-full h-auto max-h-[68vh] object-cover md:block"
        />

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
