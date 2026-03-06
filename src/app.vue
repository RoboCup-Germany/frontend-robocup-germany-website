<script setup lang="ts">
const route = useRoute()
const cookieLocale = computed(() => (route.path.startsWith('/en') ? 'en' : 'de'))
const runtimeConfig = useRuntimeConfig()
const gtmId = runtimeConfig.public.gtmId as string
const enabledCookieIdsRaw = useCookie<string | undefined>('ncc_e')

const isGoogleTagManagerEnabled = computed(() => {
  if (!gtmId) return false
  return (enabledCookieIdsRaw.value ?? '').split('~').includes('google-tag-manager')
})
</script>

<template>
  <UApp>
    <!-- Google Tag Manager (noscript) -->
    <noscript v-if="isGoogleTagManagerEnabled">
      <iframe
        :src="`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`"
        height="0"
        width="0"
        style="display:none;visibility:hidden"
      />
    </noscript>
    <!-- End Google Tag Manager (noscript) -->
    <NuxtLayout>
      <NuxtPage :key="route.fullPath" />
    </NuxtLayout>
    <CookieControl :locale="cookieLocale" />
  </UApp>
</template>

<style scoped>
</style>
