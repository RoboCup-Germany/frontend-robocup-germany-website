<script setup lang="ts">
const route = useRoute()

const queryFlagEnabled = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(queryFlagEnabled)
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }

  return value === 1 || value === true
}

const hideChrome = computed(() => queryFlagEnabled(route.query.download))
</script>

<template>
  <SiteHeader v-if="!hideChrome" />
  <slot/>
  <img
    v-if="!hideChrome"
    src="/assets/RCgermany_element2.webp"
    alt=""
    aria-hidden="true"
    class="block h-auto w-full"
    loading="lazy"
    decoding="async"
    width="2000"
    height="741"
  />
  <SiteFooter v-if="!hideChrome" />
</template>

<style scoped>

</style>
