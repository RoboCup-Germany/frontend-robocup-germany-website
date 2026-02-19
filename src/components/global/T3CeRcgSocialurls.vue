<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';

defineOptions({
  inheritAttrs: false
});

type SocialChannel =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'whatsapp'
  | 'bluesky';

type SocialUrls = Partial<Record<SocialChannel, string>>;

interface T3CeRcgSocialurls extends T3CeBaseProps {
  socialUrls?: SocialUrls | null;
  content?: {
    socialUrls?: SocialUrls | null;
  } | null;
  space_before_class?: string;
  space_after_class?: string;
}

const props = withDefaults(defineProps<T3CeRcgSocialurls>(), {
  socialUrls: () => ({}),
  space_before_class: '',
  space_after_class: ''
});

const channelConfig: Array<{ key: SocialChannel; label: string; icon: string }> = [
  { key: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { key: 'youtube', label: 'YouTube', icon: 'i-simple-icons-youtube' },
  { key: 'tiktok', label: 'TikTok', icon: 'i-simple-icons-tiktok' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  { key: 'twitter', label: 'Twitter', icon: 'i-simple-icons-twitter' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'i-simple-icons-whatsapp' },
  { key: 'bluesky', label: 'Bluesky', icon: 'i-simple-icons-bluesky' }
];

const spacingClasses = computed(() => [props.space_before_class, props.space_after_class].filter(Boolean));

const socialLinks = computed(() => {
  const urls = props.socialUrls ?? props.content?.socialUrls ?? {};

  return channelConfig
    .map((channel) => {
      const href = urls[channel.key]?.trim();

      if (!href) {
        return null;
      }

      return {
        ...channel,
        href
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});
</script>

<template>
  <section :class="spacingClasses">
    <UContainer>
      <div class="rcg-socialurls">
        <a
          v-for="channel in socialLinks"
          :key="channel.key"
          :href="channel.href"
          class="social-button"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${channel.label} öffnen`"
        >
          <UIcon :name="channel.icon" class="social-icon" />
          <span class="sr-only">{{ channel.label }}</span>
        </a>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.rcg-socialurls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
}

.social-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background: #0d6efd;
  color: #fff;
  transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}

.social-button:hover,
.social-button:focus-visible {
  background: #0b5ed7;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgb(11 94 215 / 0.28);
}

.social-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.social-icon {
  width: 1.8rem;
  height: 1.8rem;
}
</style>
