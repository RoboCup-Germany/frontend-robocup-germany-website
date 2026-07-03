<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';

defineOptions({
  inheritAttrs: false
});

type MediaSource = 'file' | 'youtube';

interface MediaPlayerFile extends MediaRef {
  mimeType?: string;
}

interface T3CeRcgMediaplayer extends T3CeBaseProps {
  media_source?: MediaSource | string | null;
  media_file?: MediaPlayerFile[] | null;
  youtube_url?: LinkRef | null;
}

const props = withDefaults(defineProps<T3CeRcgMediaplayer>(), {
  media_source: null,
  media_file: null,
  youtube_url: null
});

const mediaFile = computed(() => {
  return Array.isArray(props.media_file)
    ? props.media_file[0] ?? null
    : null;
});

const videoUrl = computed(() => {
  if (props.media_source !== 'file') {
    return null;
  }

  return mediaFile.value?.publicUrl || null;
});

const videoMimeType = computed(() => mediaFile.value?.mimeType || undefined);

const youtubeUrl = computed(() => {
  if (props.media_source !== 'youtube') {
    return null;
  }

  return props.youtube_url?.url || null;
});

const extractYoutubeVideoId = (url: string | null): string | null => {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/);
      return embedMatch?.[1] ?? null;
    }

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    }
  } catch {
    return null;
  }

  return null;
};

const youtubeVideoId = computed(() => extractYoutubeVideoId(youtubeUrl.value));

const youtubeEmbedUrl = computed(() => {
  return youtubeVideoId.value
    ? `https://www.youtube-nocookie.com/embed/${youtubeVideoId.value}`
    : null;
});
</script>

<template>
  <UContainer v-if="videoUrl || youtubeEmbedUrl">
    <div class="aspect-video w-full overflow-hidden bg-black">
      <video
        v-if="videoUrl"
        class="h-full w-full"
        controls
        playsinline
        preload="metadata"
      >
        <source :src="videoUrl" :type="videoMimeType">
      </video>

      <iframe
        v-else-if="youtubeEmbedUrl"
        class="h-full w-full border-0"
        :src="youtubeEmbedUrl"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      />
    </div>
  </UContainer>
</template>
