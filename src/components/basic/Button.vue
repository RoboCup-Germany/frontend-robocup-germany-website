<script setup lang="ts">
import { computed } from 'vue';

const sizeMap = {
  small: 'sm',
  medium: 'md',
  large: 'lg'
} as const;

type UiButtonColor = 'primary' | 'junior' | 'major';
type UiButtonVariant = 'solid' | 'outline';

type ButtonColorInput = 'primary' | 'junior' | 'major' | 'secondary' | 'outline';

interface Props
{
  label?: string;
  to?: LinkRef | null;
  color?: ButtonColorInput;
  variant?: UiButtonVariant;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  color: 'primary',
  variant: 'solid',
  size: 'medium',
  to: null
});

const href = computed(() => {
  const link = props.to;

  if (!link) {
    return undefined;
  }

  return link.url || link.attr?.href || undefined;
});

const resolvedColor = computed<UiButtonColor>(() => {
  if (props.color === 'junior') {
    return 'junior';
  }

  if (props.color === 'major') {
    return 'major';
  }

  if (props.color === 'secondary') {
    return 'major';
  }

  return 'primary';
});

const resolvedVariant = computed<UiButtonVariant>(() => {
  if (props.color === 'outline') {
    return 'outline';
  }

  return props.variant;
});

const uTarget = computed(() => props.to?.target);
const uSize = computed(() => sizeMap[props.size]);
</script>

<template>
  <UButton
    v-if="label && href"
    :size="uSize"
    :color="resolvedColor"
    :variant="resolvedVariant"
    :to="href"
    :target="uTarget"
  >
    <slot>{{ props.label }}</slot>
  </UButton>
</template>
