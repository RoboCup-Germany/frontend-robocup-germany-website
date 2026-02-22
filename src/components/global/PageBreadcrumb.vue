<script setup lang="ts">
import { computed } from 'vue'

type BreadcrumbItem = {
  title?: string
  link?: string
  spacer?: number
}

type LocaleItem = {
  active?: number
  twoLetterIsoCode?: string
  hreflang?: string
}

const { pageData } = useT3Api()
const route = useRoute()

const rawBreadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items = (pageData.value as { breadcrumbs?: BreadcrumbItem[] } | null)?.breadcrumbs
  return Array.isArray(items) ? items : []
})

const activeLocaleCode = computed<'de' | 'en'>(() => {
  const locales = (pageData.value as { i18n?: LocaleItem[] } | null)?.i18n
  const activeLocale = Array.isArray(locales) ? locales.find((item) => item?.active === 1) : null
  const iso = (activeLocale?.twoLetterIsoCode || '').toLowerCase()
  const hreflang = (activeLocale?.hreflang || '').toLowerCase()

  if (iso === 'en' || hreflang.startsWith('en')) {
    return 'en'
  }

  return /^\/en(\/|$)/.test(route.path.toLowerCase()) ? 'en' : 'de'
})

const homeLabel = computed(() => (activeLocaleCode.value === 'en' ? 'Home' : 'Startseite'))
const homeLink = computed(() => (activeLocaleCode.value === 'en' ? '/en' : '/'))

const normalizedPath = computed(() => {
  const path = (route.path || '/').trim()
  if (!path) return '/'
  const normalized = path.replace(/\/+$/, '')
  return normalized || '/'
})

const isHomePage = computed(() => normalizedPath.value === '/' || normalizedPath.value === '/en')

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const cleaned = rawBreadcrumbs.value.filter((item) => item?.spacer !== 1)
  if (!cleaned.length) return []

  return cleaned.map((item, index) => {
    if (index !== 0) {
      return item
    }

    return {
      ...item,
      title: homeLabel.value,
      link: homeLink.value
    }
  })
})

const currentIndex = computed(() => {
  return breadcrumbs.value.length - 1
})

const shouldShow = computed(() => !isHomePage.value && breadcrumbs.value.length > 0)
</script>

<template>
  <nav
    v-if="shouldShow"
    aria-label="Breadcrumb"
    class="mb-4"
  >
    <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-black/70">
      <li
        v-for="(item, index) in breadcrumbs"
        :key="`${item.link || item.title || index}`"
        class="inline-flex items-center gap-2"
      >
        <NuxtLink
          v-if="index < currentIndex && item.link"
          :to="item.link"
          class="hover:underline"
        >
          {{ item.title }}
        </NuxtLink>
        <span
          v-else
          :class="index === currentIndex ? 'font-bold text-primary' : 'text-black'"
        >
          {{ item.title }}
        </span>
        <span v-if="index < breadcrumbs.length - 1" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>
