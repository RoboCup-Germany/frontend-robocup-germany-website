<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { H3Error } from 'h3'
import Button from '~/components/basic/Button.vue'

interface ErrorPageRef {
  source?: string
  uid?: number | string
}

interface InitialDataGlobalConfig {
  errorHandling?: {
    notFoundPage?: ErrorPageRef
  }
}

const props = defineProps<{
  error: H3Error
}>()

const requestUrl = useRequestURL()
const route = useRoute()
const safePath = `${requestUrl.pathname}${requestUrl.search || ''}` || '/'
const { initialData, pageData } = useT3Api(safePath)
const nuxtError = useError()

const extractT3PageUid = (value?: string): number | null => {
  if (!value) return null
  const match = value.trim().match(/^t3:\/\/page\?(.+)$/i)
  if (!match) return null

  const params = new URLSearchParams(match[1])
  const uid = Number(params.get('uid'))
  return Number.isFinite(uid) ? uid : null
}

const parseUid = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

const configuredNotFoundUid = computed(() => {
  const globalConfig = initialData.value?.globalConfig as InitialDataGlobalConfig | undefined
  const notFoundPage = globalConfig?.errorHandling?.notFoundPage
  if (!notFoundPage) return null

  return extractT3PageUid(notFoundPage.source) ?? parseUid(notFoundPage.uid)
})

const { data: resolvedNotFoundLink } = await useAsyncData<string>(
  () => `error-not-found-link:${configuredNotFoundUid.value ?? 'none'}`,
  async () => {
    const uid = configuredNotFoundUid.value
    if (uid === null) {
      return '/'
    }

    try {
      const page = await $fetch<{ slug?: string }>('/api/typo3/', {
        query: { id: uid }
      })
      const slug = typeof page?.slug === 'string' ? page.slug.trim() : ''
      return slug || '/'
    }
    catch {
      return '/'
    }
  },
  { default: () => '/' }
)

const statusCode = computed(() => props.error?.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)
const requestedPath = computed(() => {
  const path = route?.fullPath || safePath || '/'
  return path.startsWith('/') ? path : `/${path}`
})
const statusMessage = computed(() => props.error?.statusMessage || props.error?.message || 'Es ist ein Fehler aufgetreten.')
const primaryLink = computed(() => (isNotFound.value ? (resolvedNotFoundLink.value || '/') : '/'))
const primaryLabel = computed(() => (isNotFound.value ? 'Zur passenden Seite' : 'Zur Startseite'))
const homeLink: LinkRef = { url: '/' }
const primaryButtonLink = computed<LinkRef>(() => ({ url: primaryLink.value }))
const pageDataFallback = computed(() => {
  const errorData = nuxtError.value?.data
  if (!errorData) {
    return null
  }

  try {
    if (typeof errorData === 'string') {
      return JSON.parse(errorData) as { appearance?: { backendLayout?: string }, content?: unknown }
    }
    return errorData as { appearance?: { backendLayout?: string }, content?: unknown }
  }
  catch {
    return null
  }
})
const backendLayout = computed(() => pageDataFallback.value?.appearance?.backendLayout || 'default')

watchEffect(() => {
  const fallback = pageDataFallback.value as Record<string, unknown> | null
  if (!fallback) {
    return
  }

  // Make TYPO3 error payload available to SiteHeader/SiteFooter that read useT3Api state.
  if (!pageData.value) {
    pageData.value = fallback
  }

  const currentInitial = (initialData.value ?? {}) as Record<string, unknown>
  const mergedInitial = {
    ...currentInitial,
    globalConfig: currentInitial.globalConfig ?? fallback.globalConfig,
    headerNavigation: currentInitial.headerNavigation ?? fallback.headerNavigation,
    footerNavigation: currentInitial.footerNavigation ?? fallback.footerNavigation,
    i18n: currentInitial.i18n ?? fallback.i18n
  }
  initialData.value = mergedInitial
})
</script>

<template>
  <SiteHeader />
  <main class="relative overflow-visible py-16 md:py-24">
    <div class="container mx-auto px-4">
        <section class="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div class="flex flex-col items-start">
          <p class="text-sm font-semibold uppercase tracking-wider text-primary">
            Fehler {{ statusCode }}
          </p>
          <h1 class="mt-3 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            Ups.
          </h1>
          <h2 class="mt-3 text-2xl font-bold text-slate-800 md:text-3xl">
            Hier ist etwas schief gelaufen...
          </h2>
          <p class="mt-6 text-base leading-relaxed text-slate-700">
            Wir haben versucht <span class="font-semibold text-slate-900">{{ requestedPath }}</span>
            aufzurufen, aber haben nichts gefunden. Schau dich nochmal in der Navigation um, vielleicht findest du das Richtige.
            Wenn nicht, frag uns gerne unter
            <a class="font-semibold text-primary underline decoration-2 underline-offset-2" href="mailto:kontakt@robocup.de">kontakt@robocup.de</a>.
          </p>
          <p
            v-if="!isNotFound"
            class="mt-4 text-sm text-slate-600"
          >
            Technische Meldung: {{ statusMessage }}
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <Button
              :to="primaryButtonLink"
              :label="primaryLabel"
              color="primary"
            />
            <Button
              v-if="isNotFound"
              :to="homeLink"
              label="Zur Startseite"
              color="primary"
              variant="outline"
            />
          </div>
          </div>

          <div class="flex items-center justify-center lg:justify-end">
            <img
              src="/assets/RCgermany_Logo.png"
              alt="RoboCup Germany Logo"
              class="h-auto w-full max-w-sm object-contain"
              width="640"
              height="286"
            >
          </div>
        </section>

        <section
          v-if="pageDataFallback?.content"
          class="mt-8"
        >
          <T3BackendLayout
            :name="backendLayout"
            :content="pageDataFallback.content"
          />
        </section>
    </div>
  </main>
  <img
    src="/assets/RCgermany_element2.webp"
    alt=""
    aria-hidden="true"
    class="block h-auto w-full"
    loading="lazy"
    decoding="async"
    width="2000"
    height="741"
  />
  <SiteFooter />
</template>
