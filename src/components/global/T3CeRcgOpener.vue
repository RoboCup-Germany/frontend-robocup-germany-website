<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue'
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgOpener extends T3CeBaseProps
{
  button_link: LinkRef | null;
  button_size: 'small' | 'medium' | 'large';
  button_text: string;
  color_select: 'primary' | 'secondary' | 'outline';
  header?: string;
  // Legacy single media array
  media?: MediaRef[];
  // New responsive sources
  media_landscape?: MediaRef[];
  media_portrait?: MediaRef[];
}

const props = withDefaults(defineProps<T3CeRcgOpener>(), {});

const hasButton = computed(() => {
  const label = props.button_text?.trim();
  const link = props.button_link;
  const href = link?.url || link?.attr?.href || undefined;
  return Boolean(label && href);
});

const firstUrl = (arr?: MediaRef[]) => arr?.[0]?.publicUrl?.trim() || ''
const legacyUrl = computed(() => firstUrl(props.media))
const landscapeUrl = computed(() => firstUrl(props.media_landscape) || firstUrl(props.media))
const portraitUrl = computed(() => firstUrl(props.media_portrait) || firstUrl(props.media))

const isVideo = (url: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(url)
const isImage = (url: string) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url)
</script>

<template>
  <div class="relative w-full overflow-hidden">
    <!-- PORTRAIT: shown on small screens -->
    <video
        v-if="portraitUrl && isVideo(portraitUrl)"
        :src="portraitUrl"
        autoplay
        muted
        playsinline
        loop
        preload="metadata"
        aria-hidden="true"
        tabindex="-1"
        role="presentation"
        class="block md:hidden w-full h-[80vh] md:h-[80vh] lg:h-screen object-cover"
    />
    <img
        v-else-if="portraitUrl && isImage(portraitUrl)"
        :src="portraitUrl"
        alt=""
        aria-hidden="true"
        class="block md:hidden w-full h-[80vh] md:h-[80vh] lg:h-screen object-cover"
    />

    <!-- LANDSCAPE: shown on md+ screens -->
    <video
        v-if="landscapeUrl && isVideo(landscapeUrl)"
        :src="landscapeUrl"
        autoplay
        muted
        playsinline
        loop
        preload="metadata"
        aria-hidden="true"
        tabindex="-1"
        role="presentation"
        class="hidden md:block w-full h-[80vh] md:h-[80vh] lg:h-screen object-cover"
    />
    <img
        v-else-if="landscapeUrl && isImage(landscapeUrl)"
        :src="landscapeUrl"
        alt=""
        aria-hidden="true"
        class="hidden md:block w-full h-[80vh] md:h-[80vh] lg:h-screen object-cover"
    />

    <!-- LEGACY FALLBACK: when only `media` is provided -->
    <video
        v-if="!portraitUrl && !landscapeUrl && legacyUrl && isVideo(legacyUrl)"
        :src="legacyUrl"
        autoplay
        muted
        playsinline
        loop
        preload="metadata"
        aria-hidden="true"
        tabindex="-1"
        role="presentation"
        class="w-full h-[80vh] md:h-[80vh] lg:h-screen object-cover"
    />
    <img
        v-else-if="!portraitUrl && !landscapeUrl && legacyUrl && isImage(legacyUrl)"
        :src="legacyUrl"
        alt=""
        aria-hidden="true"
        class="w-full h-[80vh] md:h-[80vh] lg:h-screen object-cover"
    />

    <div class="absolute top-0 left-0 w-full h-full bg-black/50"></div>
    <div class="absolute top-0 left-0 w-full h-full">
      <UContainer class="h-full flex flex-col items-center justify-center text-center grid">
        <div class="col-span-12 xl:col-span-8 xl:col-start-3">
          <Headline
              v-if="header"
              class="align-text-end mb-7 text-white"
              :raw-html="header"
          />
          <Button
              v-if="hasButton"
              :to="button_link"
              :size="button_size"
              :color="color_select"
              :label="button_text"
          />
        </div>
      </UContainer>
    </div>
  </div>
</template>