<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';

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
</script>

<template>
  <UContainer>
    <div class="flex flex-col items-start">
      <Headline v-if="header" :raw-html="header"/>
      <div v-if="subheader" class="mb-7 text-base italic uppercase tracking-wide text-black font-semibold">
        <T3HtmlParser :content="subheader" />
      </div>
      <div v-if="bodytext">
        <T3HtmlParser :content="bodytext" />
      </div>

      <div v-if="hasButtons" class="flex flex-wrap items-center gap-4">
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
</template>
