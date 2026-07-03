<script setup lang="ts">
type LocaleItem = {
  title?: string
  link?: string
  available?: number
  active?: number
}

const props = withDefaults(defineProps<{
  variant?: 'desktop' | 'mobile' | 'footer'
}>(), {
  variant: 'desktop'
})

const emit = defineEmits<{
  select: []
}>()

const { initialData, pageData } = useT3Api()
const route = useRoute()
const isMounted = ref(false)
const localeDropdown = ref<HTMLDetailsElement | null>(null)
const { normalize } = useCmsLink()

onMounted(() => {
  isMounted.value = true
})

const localeItems = computed<LocaleItem[]>(
  () => {
    const locales = isMounted.value
      ? ((pageData.value?.i18n as LocaleItem[] | undefined) ??
        (initialData.value?.i18n as LocaleItem[] | undefined) ??
        [])
      : ((initialData.value?.i18n as LocaleItem[] | undefined) ?? [])

    return locales.filter(locale => locale.available === 1 && !!locale.link)
  }
)

const activeLocale = computed<LocaleItem | null>(() => {
  const explicitActive = localeItems.value.find(locale => locale.active === 1)
  if (explicitActive) return explicitActive

  const isEnglishPath = /^\/en(\/|$)/.test(route.path.toLowerCase())
  return {
    title: isEnglishPath ? 'English' : 'Deutsch',
    link: route.fullPath,
    available: 1,
    active: 1
  }
})

const fallbackSwitchLocale = computed<LocaleItem>(() => {
  const currentPath = route.fullPath || '/'
  const isEnglishPath = /^\/en(\/|$)/.test(route.path.toLowerCase())

  if (isEnglishPath) {
    const deLink = currentPath.replace(/^\/en(?=\/|$)/, '') || '/'
    return { title: 'Deutsch', link: deLink, available: 1, active: 0 }
  }

  const enLink = currentPath === '/' ? '/en' : `/en${currentPath}`
  return { title: 'English', link: enLink, available: 1, active: 0 }
})

const switchableLocales = computed<LocaleItem[]>(() => {
  if (!localeItems.value.length) {
    return [fallbackSwitchLocale.value]
  }

  if (!localeItems.value.some(locale => locale.active === 1)) {
    return localeItems.value
  }

  const activeLink = activeLocale.value?.link
  const alternatives = localeItems.value.filter(locale => locale.link && locale.link !== activeLink)
  return alternatives.length ? alternatives : [fallbackSwitchLocale.value]
})

const localeCode = (locale?: LocaleItem | null): 'de' | 'en' => {
  const normalizedTitle = (locale?.title ?? '').toLowerCase()
  const normalizedLink = (locale?.link ?? '').toLowerCase()

  if (normalizedTitle.includes('en') || /^\/en(\/|$)/.test(normalizedLink)) return 'en'
  return 'de'
}

const localeFlag = (locale?: LocaleItem | null) => {
  return localeCode(locale) === 'en' ? '🇬🇧' : '🇩🇪'
}

const languageLabel = computed(() => {
  return localeCode(activeLocale.value) === 'en' ? 'Language' : 'Sprache'
})

const closeLocaleDropdown = () => {
  if (localeDropdown.value) {
    localeDropdown.value.open = false
  }

  emit('select')
}
</script>

<template>
  <nav v-if="activeLocale && switchableLocales.length" aria-label="Sprachauswahl">
    <details
      ref="localeDropdown"
      class="group relative z-50"
      :class="{ 'w-full': props.variant === 'mobile' }"
    >
      <summary
        class="flex cursor-pointer list-none items-center gap-2 rounded-sm border border-black/20 bg-white text-sm font-semibold text-black marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="{
          'px-3 py-1': props.variant === 'desktop',
          '!bg-transparent w-full justify-between border-0 px-0 py-1 uppercase tracking-[0.14em]': props.variant === 'mobile',
          'h-9 w-9 justify-center rounded-full px-0 py-0': props.variant === 'footer'
        }"
      >
        <span class="inline-flex items-center gap-2">
          <span aria-hidden="true" class="text-base leading-none">{{ localeFlag(activeLocale) }}</span>
          <span v-if="props.variant !== 'footer'" :class="{ 'sr-only': props.variant === 'desktop' }">
            <template v-if="props.variant === 'mobile'">{{ languageLabel }}</template>
            <template v-else>{{ activeLocale.title }}</template>
          </span>
          <span v-else class="sr-only">{{ activeLocale.title }}</span>
        </span>
        <svg
          v-if="props.variant !== 'footer'"
          viewBox="0 0 1080 1080"
          class="h-3 w-3 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
          fill="none"
          aria-hidden="true"
        >
          <polyline
            points="841.93 389.03 540 690.97 238.07 389.03"
            stroke="currentColor"
            stroke-width="110"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </summary>

      <ul
        class="z-50 rounded-sm border border-black/20 bg-white p-1 shadow-md"
        :class="{
          'absolute right-0 mt-2 min-w-32': props.variant === 'desktop',
          'mt-3 grid list-none gap-1 border-l border-primary/50 pl-4 shadow-none': props.variant === 'mobile',
          'absolute left-1/2 mt-2 min-w-36 -translate-x-1/2': props.variant === 'footer'
        }"
      >
        <li v-for="locale in switchableLocales" :key="`${locale.title}-${locale.link}`">
          <a
            :href="normalize(locale.link!)"
            class="flex items-center gap-2 rounded-sm px-2 py-1 text-sm font-semibold text-black no-underline hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="closeLocaleDropdown"
          >
            <span aria-hidden="true" class="text-base leading-none">{{ localeFlag(locale) }}</span>
            <span>{{ locale.title }}</span>
          </a>
        </li>
      </ul>
    </details>
  </nav>
</template>
