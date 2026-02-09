<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgTeaserproject extends T3CeBaseProps
{
}

const props = withDefaults(defineProps<T3CeRcgTeaserproject>(), {});

</script>

<template>
  <UContainer>
    This is a Teaser Project component
  </UContainer>
</template>