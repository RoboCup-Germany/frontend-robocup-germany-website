<script setup lang="ts">
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';

type UiButtonColor = 'primary' | 'junior' | 'major';
type UiButtonVariant = 'solid' | 'outline';

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
}

interface Props {
  announcement?: AnnouncementBar | null;
}

const props = withDefaults(defineProps<Props>(), {
  announcement: null
});
const { normalize, isExternal } = useCmsLink();

const extractT3PageUid = (value?: string): number | null => {
  if (!value) return null;
  const match = value.trim().match(/^t3:\/\/page\?(.+)$/i);
  if (!match) return null;

  const params = new URLSearchParams(match[1]);
  const uid = Number(params.get('uid'));
  return Number.isFinite(uid) ? uid : null;
};

const t3PageUids = computed(() => {
  const buttons = Array.isArray(props.announcement?.buttons) ? props.announcement.buttons : [];
  const unique = new Set<number>();

  buttons.forEach((button) => {
    const uid = extractT3PageUid(button.link);
    if (uid !== null) unique.add(uid);
  });

  return [...unique];
});

const { data: resolvedT3PageLinks } = await useAsyncData<Record<number, string>>(
  () => `announcement-bar-links:${t3PageUids.value.join(',')}`,
  async () => {
    const result: Record<number, string> = {};

    await Promise.all(
      t3PageUids.value.map(async (uid) => {
        try {
          const page = await $fetch<{ slug?: string }>('/api/typo3/', {
            query: { id: uid }
          });
          const slug = typeof page?.slug === 'string' ? page.slug.trim() : '';
          result[uid] = slug || '/';
        }
        catch {
          result[uid] = '/';
        }
      })
    );

    return result;
  },
  { default: () => ({}) }
);

const resolveColor = (value?: AnnouncementButton['color']): UiButtonColor => {
  if (value === 'junior' || value === 'major') {
    return value;
  }

  if (value === 'secondary') {
    return 'major';
  }

  return 'primary';
};

const resolveVariant = (value?: AnnouncementButton['type']): UiButtonVariant => {
  return value === 'outline' ? 'outline' : 'solid';
};

const normalizedButtons = computed(() => {
  const items = Array.isArray(props.announcement?.buttons) ? props.announcement?.buttons : [];

  return items
    .map((button) => {
      const label = button.text?.trim() || '';
      const rawHref = button.link?.trim() || '';
      const t3Uid = extractT3PageUid(rawHref);
      const href = t3Uid !== null
        ? (resolvedT3PageLinks.value[t3Uid] || '/')
        : rawHref;
      const normalizedHref = normalize(href);

      if (!label || !normalizedHref) {
        return null;
      }

      return {
        label,
        to: {
          url: normalizedHref,
          target: isExternal(normalizedHref) ? '_blank' : null
        } as LinkRef,
        size: button.size || 'medium',
        color: resolveColor(button.color),
        variant: resolveVariant(button.type)
      };
    })
    .filter((button): button is NonNullable<typeof button> => Boolean(button));
});

const hasButtons = computed(() => normalizedButtons.value.length > 0);
const hasMultipleButtons = computed(() => normalizedButtons.value.length > 1);
const hasContent = computed(() => Boolean(props.announcement?.title || props.announcement?.description || hasButtons.value));
</script>

<template>
  <section v-if="hasContent" class="relative overflow-hidden">
    <picture>
      <source
        media="(min-width: 768px)"
        type="image/avif"
        srcset="/assets/RCgermany_element3-optimized.avif"
        width="1081"
        height="401"
      >
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcset="/assets/RCgermany_element3-optimized.webp"
        width="1081"
        height="401"
      >
      <source
        type="image/avif"
        srcset="/assets/RCgermany_element2.avif"
        width="1080"
        height="401"
      >
      <img
        src="/assets/RCgermany_element2.webp"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute bottom-0 left-1/2 z-0 h-full w-screen -translate-x-1/2 object-cover object-bottom md:bottom-auto md:left-auto md:right-0 md:top-1/2 md:h-auto md:w-auto md:max-w-none md:translate-x-0 md:-translate-y-1/2 md:object-contain md:object-right"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        width="1080"
        height="401"
      >
    </picture>

    <UContainer class="relative z-10">
      <div class="py-6 lg:py-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="min-w-0">
            <div
              v-if="announcement?.title"
              role="heading"
              aria-level="2"
              class="font-sans tracking-0 leading-snug text-primary text-[40px] md:text-[45px]"
            >
              {{ announcement.title }}
            </div>
            <div v-if="announcement?.description">
              <T3HtmlParser class="rte-content font-bold italic" :content="announcement.description" />
            </div>
          </div>

          <div
            v-if="hasButtons"
            class="flex shrink-0 gap-4"
            :class="hasMultipleButtons ? 'flex-col items-start lg:items-end' : 'flex-row items-center'"
          >
            <Button
              v-for="(button, index) in normalizedButtons"
              :key="`${button.label}-${index}`"
              :to="button.to"
              :color="button.color"
              :variant="button.variant"
              :size="button.size"
              :label="button.label"
            />
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
