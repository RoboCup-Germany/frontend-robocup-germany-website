<script setup lang="ts">
const route = useRoute()
const cookieLocale = computed(() => (route.path.startsWith('/en') ? 'en' : 'de'))
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage :key="route.fullPath" />
    </NuxtLayout>
    <CookieControl :locale="cookieLocale" />
  </UApp>
</template>

<style scoped>
</style>
