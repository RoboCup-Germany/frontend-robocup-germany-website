<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';

defineOptions({
  inheritAttrs: false
});

type UiButtonColor = 'primary' | 'junior' | 'major';
type UiButtonVariant = 'solid' | 'outline';

type ContentButton = {
  button_text?: string;
  button_link?: LinkRef | null;
  button_size?: 'small' | 'medium' | 'large';
  button_type?: 'full' | 'outline' | 'solid';
  color_select?: 'main' | 'primary' | 'junior' | 'major' | 'secondary';
};

interface T3CeRcgTextButton extends T3CeBaseProps
{
  header?: string;
  header_layout?: number | string;
  subheader?: string;
  bodytext?: string;
  background?: 0 | 1;
  button_text?: string;
  color_select?: ContentButton['color_select'];
  button_link?: LinkRef | null;
  button_size?: 'small' | 'medium' | 'large';
  button_type?: ContentButton['button_type'];
  buttons?: ContentButton[];
}

const props = withDefaults(defineProps<T3CeRcgTextButton>(), {
  header: '',
  header_layout: 2,
  subheader: undefined,
  bodytext: '',
  background: 0,
  button_text: '',
  color_select: 'primary',
  button_link: null,
  button_size: 'medium',
  button_type: 'full',
  buttons: () => []
});

const resolveColor = (value?: ContentButton['color_select']): UiButtonColor => {
  if (value === 'main') {
    return 'primary';
  }

  if (value === 'junior' || value === 'major') {
    return value;
  }

  if (value === 'secondary') {
    return 'major';
  }

  return 'primary';
};

const resolveVariant = (value?: ContentButton['button_type']): UiButtonVariant => {
  return value === 'outline' ? 'outline' : 'solid';
};

const normalizedButtons = computed(() => {
  const items = Array.isArray(props.buttons) ? props.buttons : [];

  if (items.length > 0) {
    return items
      .map((button) => {
        const label = button.button_text?.trim() || '';
        const link = button.button_link || null;
        const href = link?.url || link?.attr?.href || undefined;

        if (!label || !href) {
          return null;
        }

        return {
          label,
          to: link,
          size: button.button_size || 'medium',
          color: resolveColor(button.color_select),
          variant: resolveVariant(button.button_type)
        };
      })
      .filter((button): button is NonNullable<typeof button> => Boolean(button));
  }

  const legacyLabel = props.button_text?.trim() || '';
  const legacyLink = props.button_link;
  const legacyHref = legacyLink?.url || legacyLink?.attr?.href || undefined;

  if (!legacyLabel || !legacyHref) {
    return [];
  }

  return [{
    label: legacyLabel,
    to: legacyLink,
    size: props.button_size,
    color: resolveColor(props.color_select),
    variant: resolveVariant(props.button_type)
  }];
});

const hasButtons = computed(() => normalizedButtons.value.length > 0);

const hasBackgroundElement = computed(() => props.background === 1);
</script>

<template>
  <div class="relative overflow-visible">
    <img
      v-if="hasBackgroundElement"
      src="/assets/RCgermany_element2.png"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute bottom-0 left-1/2 z-0 h-full w-screen -translate-x-1/2 object-cover object-bottom md:object-top"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    >

    <UContainer>
      <div class="relative z-10 flex flex-col items-start">
        <SectionHeader
          :header="header"
          :subheader="subheader"
          subheader-class="mb-4 text-base italic uppercase tracking-wide text-black font-semibold"
        />
        <div v-if="bodytext" class="mb-4">
          <T3HtmlParser class="rte-content" :content="bodytext" />
        </div>

        <div v-if="hasButtons" class="mb-6 flex flex-wrap items-center gap-4">
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
    </UContainer>
  </div>
</template>
