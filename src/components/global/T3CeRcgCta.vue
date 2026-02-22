<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';
import { pickFirstDisplayImage } from '~/utils/media-image';

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

interface T3CeRcgCta extends T3CeBaseProps {
  header?: string;
  buttons?: ContentButton[];
  image?: MediaRef[] | Record<string, unknown>[] | null;
  space_before_class?: string;
  space_after_class?: string;
}

const props = withDefaults(defineProps<T3CeRcgCta>(), {
  header: '',
  buttons: () => [],
  image: () => [],
  space_before_class: '',
  space_after_class: ''
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
});

const logoImage = computed(() => pickFirstDisplayImage(props.image));
const logoSrc = computed(() => logoImage.value?.urlDefault || '/assets/RCgermany_Logo.png');
const logoAlt = computed(() => logoImage.value?.alt || logoImage.value?.title || 'RoboCup Germany');

const spacingClasses = computed(() => {
  return [props.space_before_class, props.space_after_class].filter(Boolean);
});
</script>

<template>
  <section :class="spacingClasses">
    <div class="rcg-cta-wrapper">
      <UContainer>
        <div class="rcg-cta-grid">
          <div class="rcg-cta-content">
            <Headline v-if="header" :raw-html="header" />
            <div v-if="normalizedButtons.length > 0" class="rcg-cta-button-row mt-8">
              <Button
                v-for="(button, index) in normalizedButtons"
                :key="`${button.label}-${index}`"
                :to="button.to"
                :size="button.size"
                :color="button.color"
                :variant="button.variant"
                :label="button.label"
              />
            </div>
          </div>

          <div class="rcg-cta-logo-wrap">
            <img
              :src="logoSrc"
              :alt="logoAlt"
              loading="lazy"
              decoding="async"
              class="rcg-cta-logo"
            >
          </div>
        </div>
      </UContainer>
    </div>
  </section>
</template>

<style scoped>
.rcg-cta-wrapper {
  position: relative;
  isolation: isolate;
  padding: 70px 0;
}

.rcg-cta-wrapper::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 250px;
  height: min(200px, calc(100% - 110px));
  background-image: url('/assets/RCgeramy_element1.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}

.rcg-cta-grid {
  position: relative;
  z-index: 1;
  display: grid;
  align-items: center;
  gap: 30px;
}

.rcg-cta-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.rcg-cta-content :deep(h2) {
  margin: 0;
  color: var(--color-primary);
  font-size: clamp(38px, 5.2vw, 66px);
  line-height: 1.05;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  max-width: 13ch;
}

.rcg-cta-logo-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

.rcg-cta-logo {
  width: min(100%, 360px);
  height: auto;
  object-fit: contain;
}

.rcg-cta-button-row {
  display: flex;
  width: 100%;
  justify-content: center;
}

@media (min-width: 992px) {
  .rcg-cta-wrapper::before {
    top: 52%;
    transform: translateY(-28%);
    height: min(200px, 50%);
    background-position: center center;
  }

  .rcg-cta-grid {
    grid-template-columns: 1fr minmax(260px, 38%);
    gap: 40px;
  }

  .rcg-cta-button-row {
    justify-content: flex-start;
  }
}
</style>
