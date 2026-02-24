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

interface T3CeRcgTexttwocol extends T3CeBaseProps
{
  header?: string;
  header_layout?: number | string;
  subheader?: string;
  background?: 0 | 1 | '0' | '1';
  text_left?: string;
  text_right?: string;
  buttons_left?: ContentButton[];
  buttons_right?: ContentButton[];
  bodytext?: string;
  button_text?: string;
  color_select?: ContentButton['color_select'];
  button_link?: LinkRef | null;
  button_size?: 'small' | 'medium' | 'large';
  button_type?: ContentButton['button_type'];
}

const props = withDefaults(defineProps<T3CeRcgTexttwocol>(), {
  header: '',
  header_layout: 2,
  subheader: '',
  background: 0,
  text_left: '',
  text_right: '',
  buttons_left: () => [],
  buttons_right: () => [],
  bodytext: '',
  button_text: '',
  color_select: 'primary',
  button_link: null,
  button_size: 'medium',
  button_type: 'full'
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

const normalizeButtons = (buttons?: ContentButton[]) => {
  const items = Array.isArray(buttons) ? buttons : [];

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
};

const leftButtons = computed(() => {
  const normalized = normalizeButtons(props.buttons_left);

  if (normalized.length > 0) {
    return normalized;
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

const rightButtons = computed(() => normalizeButtons(props.buttons_right));

const leftText = computed(() => props.text_left || props.bodytext || '');

const hasLeftContent = computed(() => Boolean(leftText.value) || leftButtons.value.length > 0);
const hasRightContent = computed(() => Boolean(props.text_right) || rightButtons.value.length > 0);
const hasBackgroundElement = computed(() => Number(props.background) === 1);
</script>

<template>
  <div class="relative overflow-visible">
    <img
      v-if="hasBackgroundElement"
      src="/assets/RCgermany_element2.webp"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute bottom-0 left-1/2 z-0 h-full w-screen -translate-x-1/2 object-cover object-bottom md:object-top"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    />

    <UContainer>
      <div class="relative z-10">
        <SectionHeader
          :header="header"
          :subheader="subheader"
          subheader-class="mb-6 text-base italic uppercase tracking-wide text-black font-semibold"
        />

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div v-if="hasLeftContent" class="flex flex-col items-start">
            <T3HtmlParser class="rte-content" v-if="leftText" :content="leftText" />
            <div v-if="leftButtons.length > 0" class="mt-6 mb-6 flex flex-wrap items-center gap-4">
              <Button
                v-for="(button, index) in leftButtons"
                :key="`left-${button.label}-${index}`"
                :to="button.to"
                :size="button.size"
                :color="button.color"
                :variant="button.variant"
                :label="button.label"
              />
            </div>
          </div>

          <div v-if="hasRightContent" class="flex flex-col items-start">
            <T3HtmlParser class="rte-content" v-if="text_right" :content="text_right" />
            <div v-if="rightButtons.length > 0" class="mt-6 mb-6 flex flex-wrap items-center gap-4">
              <Button
                v-for="(button, index) in rightButtons"
                :key="`right-${button.label}-${index}`"
                :to="button.to"
                :size="button.size"
                :color="button.color"
                :variant="button.variant"
                :label="button.label"
              />
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
