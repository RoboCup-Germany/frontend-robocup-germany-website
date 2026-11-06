<script setup lang="ts">
import { computed } from 'vue';

/**
 * Makes an image clickable without changing its layout: renders a link that covers the
 * nearest positioned ancestor (the image wrapper needs `position: relative`).
 */
const props = withDefaults(defineProps<{
  href?: string | null;
  /** Accessible name of the link, usually the alt text of the image. */
  label?: string | null;
}>(), {
  href: null,
  label: null
});

const { normalize, isExternal } = useCmsLink();

const to = computed(() => normalize(props.href));
const external = computed(() => isExternal(to.value));
const ariaLabel = computed(() => props.label?.trim() || undefined);
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :external="external"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    :aria-label="ariaLabel"
    class="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
  />
</template>
