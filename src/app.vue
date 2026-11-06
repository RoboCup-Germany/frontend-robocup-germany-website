<script setup lang="ts">
import { computed } from 'vue'
import Lightbox from './components/basic/Lightbox.vue'

type LocaleItem = {
  active?: number
  title?: string
  link?: string
  twoLetterIsoCode?: string
  hreflang?: string
}

const route = useRoute()
const { initialData, pageData } = useT3Api()

const cookieLocale = computed<'de' | 'en'>(() => {
  const locales = (
    (pageData.value?.i18n as LocaleItem[] | undefined) ??
    (initialData.value?.i18n as LocaleItem[] | undefined) ??
    []
  )
  const activeLocale = locales.find((item) => item?.active === 1)
  const iso = (activeLocale?.twoLetterIsoCode || '').toLowerCase()
  const hreflang = (activeLocale?.hreflang || '').toLowerCase()
  const title = (activeLocale?.title || '').toLowerCase()
  const link = (activeLocale?.link || '').toLowerCase()

  if (iso === 'en' || hreflang.startsWith('en') || title.includes('en') || /^\/en(\/|$)/.test(link)) {
    return 'en'
  }

  return /^\/en(\/|$)/.test(route.path.toLowerCase()) ? 'en' : 'de'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage :key="route.fullPath" />
    </NuxtLayout>
    <CookieControl :locale="cookieLocale" />
<Lightbox />
  </UApp>
</template>

<style scoped>
</style>
