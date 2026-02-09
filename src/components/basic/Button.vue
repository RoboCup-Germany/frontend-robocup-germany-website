<script setup lang="ts">

import {computed} from 'vue';

const sizeMap = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
} as const

interface Props
{
  label?: string;
  to?: LinkRef | null;
  color?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  color: 'primary',
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

const uTarget = computed(() => props.to?.target)
const uColor = computed(() => props.color);
const uTextColor = computed(() => props.color === 'primary' ? 'text-white' : props.color == 'secondary' ? 'text-black' : 'text-primary');
const uSize = computed(() => sizeMap[props.size]);

</script>

<template>
  <UButton v-if="label && href" :size="uSize" :color="uColor" :to="href" :target="uTarget" :class="uTextColor">
    <slot>{{ props.label }}</slot>
  </UButton>
</template>
