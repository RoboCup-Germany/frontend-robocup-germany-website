<template>
  <component
    :is="`h${header_layout}`"
    v-bind="$attrs"
    :class="headingClass"
  >
  {{ header }}
  </component>
</template>

<script setup lang="ts">
import type { T3CeBaseProps, T3File } from '@t3headless/nuxt-typo3';

defineOptions({
  inheritAttrs: false
})

interface T3CeThemeHeader extends T3CeBaseProps {
  header: string,
  header_layout: number | string,
  headingClass?: string
}
const props = withDefaults(defineProps<T3CeThemeHeader>(), {
  header: '',
  header_layout: 1,
  headingClass: ''
})
</script>