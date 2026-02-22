<script setup lang="ts">
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';

interface MediaItem {
  publicUrl?: string | null;
  url?: string | null;
  originalUrl?: string | null;
  alt?: string | null;
  alternative?: string | null;
  description?: string | null;
  title?: string | null;
  properties?: {
    title?: string | null;
    alternative?: string | null;
    description?: string | null;
    originalUrl?: string | null;
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

const imageDesktopUrl = computed(() => {
  const media = mediaItem.value;
  if (!media) return '';
  return toUrl(
    media.cropVariants?.default?.publicUrl
    || media.cropVariants?.default?.url
    || media.publicUrl
    || media.url
    || media.originalUrl
    || media.properties?.originalUrl
  );
});

const imageMobileUrl = computed(() => {
  const media = mediaItem.value;
  if (!media) return '';
  return toUrl(
    media.cropVariants?.small?.publicUrl
    || media.cropVariants?.small?.url
    || media.cropVariants?.default?.publicUrl
    || media.cropVariants?.default?.url
    || media.publicUrl
    || media.url
    || media.originalUrl
    || media.properties?.originalUrl
  );
});

const imageAlt = computed(() => {
  const media = mediaItem.value;
  if (!media) return '';

  return media.alt
    || media.alternative
    || media.description
    || media.title
    || media.properties?.alternative
    || media.properties?.description
    || media.properties?.title
    || props.title
    || 'Seitenbild';
});

const imageMobileDisplayUrl = computed(() => imageMobileUrl.value || imageDesktopUrl.value);
const imageDesktopDisplayUrl = computed(() => imageDesktopUrl.value || imageMobileUrl.value);

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
        <img
          v-if="imageMobileDisplayUrl"
          :src="imageMobileDisplayUrl"
          :alt="imageAlt"
          class="block w-full aspect-square object-cover md:hidden"
        >
        <img
          v-if="imageDesktopDisplayUrl"
          :src="imageDesktopDisplayUrl"
          :alt="imageAlt"
          class="hidden w-full h-auto max-h-[68vh] object-cover md:block"
        >

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

      <UContainer v-if="hasHeadline" class="relative z-40 bg-white py-10 lg:py-14">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="subtitle" class="text-base italic tracking-wide text-black/90">{{ subtitle }}</p>
      </UContainer>
    </template>

    <template v-else>
      <UContainer class="py-10 lg:py-14">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="subtitle" class="mt-4 text-base italic tracking-wide text-black/90">{{ subtitle }}</p>
      </UContainer>
    </template>
  </section>
</template>
