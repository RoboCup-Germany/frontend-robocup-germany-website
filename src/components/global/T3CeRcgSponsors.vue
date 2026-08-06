<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';
import { toDisplayImage } from '~/utils/media-image';

interface SponsorImage {
  id?: number | string | null;
  alt?: string | null;
  title?: string | null;
  filename?: string | null;
  publicUrl?: string | null;
  originalUrl?: string | null;
  cropVariants?: {
    default?: {
      publicUrl?: string | null;
      url?: string | null;
    } | null;
  } | null;
}

interface T3CeRcgSponsorsProps extends T3CeBaseProps {
  header?: string | null;
  subheader?: string | null;
  main?: SponsorImage[] | string | null;
  secondary?: SponsorImage[] | string | null;
  third?: SponsorImage[] | string | null;
}

const props = withDefaults(defineProps<T3CeRcgSponsorsProps>(), {
  header: '',
  subheader: ''
});

const toArray = (value: SponsorImage[] | string | null | undefined): SponsorImage[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as SponsorImage[]) : [];
    } catch {
      return [];
    }
  }

  return [];
};

const mainItems = computed(() => toArray(props.main));
const secondaryItems = computed(() => toArray(props.secondary));
const thirdItems = computed(() => toArray(props.third));

const getImageUrl = (item: SponsorImage): string => {
  const image = toDisplayImage(item);

  return image?.urlDefault
    || image?.urlSmall
    || item.cropVariants?.default?.publicUrl
    || item.cropVariants?.default?.url
    || item.publicUrl
    || item.originalUrl
    || '';
};

const getImageSrcsetDefault = (item: SponsorImage): string => {
  return toDisplayImage(item)?.srcsetDefault || '';
};

const getImageSrcsetSmall = (item: SponsorImage): string => {
  return toDisplayImage(item)?.srcsetSmall || '';
};

const getAlt = (item: SponsorImage): string => {
  return item.alt?.trim()
    || item.title?.trim()
    || item.filename?.trim()
    || 'Sponsor-Logo';
};
</script>

<template>
  <UContainer>
    <section class="flex flex-col gap-8">
      <SectionHeader
        :header="header || ''"
        :subheader="subheader || ''"
        subheader-class="mb-0 text-base text-black/80"
      />

      <div v-if="mainItems.length" class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          v-for="(item, index) in mainItems"
          :key="item.id ?? `main-${index}`"
          class="flex min-h-[220px] items-center justify-center rounded-xl bg-white p-6"
        >
          <picture class="block w-full">
            <source
              v-if="getImageSrcsetSmall(item)"
              media="(max-width: 767px)"
              :srcset="getImageSrcsetSmall(item)"
            >
            <img
              :src="getImageUrl(item)"
              :srcset="getImageSrcsetDefault(item) || undefined"
              :sizes="getImageSrcsetDefault(item) ? '(max-width: 767px) 100vw, 50vw' : undefined"
              :alt="getAlt(item)"
              class="block max-h-[400px] w-full object-contain"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            >
          </picture>
        </div>
      </div>

      <div v-if="secondaryItems.length" class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          v-for="(item, index) in secondaryItems"
          :key="item.id ?? `secondary-${index}`"
          class="flex min-h-[200px] items-center justify-center rounded-xl bg-white p-6"
        >
          <picture class="block w-full">
            <source
              v-if="getImageSrcsetSmall(item)"
              media="(max-width: 767px)"
              :srcset="getImageSrcsetSmall(item)"
            >
            <img
              :src="getImageUrl(item)"
              :srcset="getImageSrcsetDefault(item) || undefined"
              :sizes="getImageSrcsetDefault(item) ? '(max-width: 767px) 100vw, 50vw' : undefined"
              :alt="getAlt(item)"
              class="block max-h-[350px] w-full object-contain"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            >
          </picture>
        </div>
      </div>

      <div v-if="thirdItems.length" class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div
          v-for="(item, index) in thirdItems"
          :key="item.id ?? `third-${index}`"
          class="flex h-[200px] items-center justify-center rounded-xl bg-white p-4"
        >
          <picture class="block w-full">
            <source
              v-if="getImageSrcsetSmall(item)"
              media="(max-width: 767px)"
              :srcset="getImageSrcsetSmall(item)"
            >
            <img
              :src="getImageUrl(item)"
              :srcset="getImageSrcsetDefault(item) || undefined"
              :sizes="getImageSrcsetDefault(item) ? '(max-width: 767px) 100vw, 33vw' : undefined"
              :alt="getAlt(item)"
              class="block max-h-[200px] w-full object-contain"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            >
          </picture>
        </div>
      </div>
    </section>
  </UContainer>
</template>
