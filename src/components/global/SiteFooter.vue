<script setup lang="ts">
type FooterNavItem = {
  title?: string
  link?: string
  target?: string
  active?: number
  current?: number
  spacer?: number
  hasSubpages?: number
  children?: FooterNavItem[]
  isCookieSettings?: boolean
}

type SocialChannel =
  | 'instagram'
  | 'youtube'
  | 'flickr'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'whatsapp'
  | 'bluesky'

type SocialUrls = Partial<Record<SocialChannel, string>>

type LocaleItem = {
  active?: number
  title?: string
  link?: string
  twoLetterIsoCode?: string
  hreflang?: string
}

const { initialData, pageData } = useT3Api()
const requestUrl = useRequestURL()
const { data: siteRootData } = useFetch<Record<string, unknown>>('/api/typo3', {
  key: `site-root:${requestUrl.host}`
})
const route = useRoute()
const isMounted = ref(false)
const siteGlobalConfig = useState<GlobalConfig | null>('site-global-config', () => null)
const siteFooterLogo = useState<{ src: string; alt?: string } | null>('site-footer-logo', () => null)

onMounted(() => {
  isMounted.value = true
})

const fallbackFooterLogoSrc = '/assets/RCgermany_Logo.png'

const firstNonEmptyNavigation = (...items: Array<unknown>): FooterNavItem[] => {
  for (const item of items) {
    if (Array.isArray(item) && item.length) {
      return item as FooterNavItem[]
    }
  }

  return []
}

const globalConfig = computed<GlobalConfig | undefined>(() => {
  if (siteGlobalConfig.value) {
    return siteGlobalConfig.value
  }

  return (
    (pageData.value?.globalConfig as GlobalConfig | undefined) ??
    (siteRootData.value?.globalConfig as GlobalConfig | undefined) ??
    (initialData.value?.globalConfig as GlobalConfig | undefined)
  )
})

const footerSections = computed<FooterNavItem[]>(() => {
  if (!isMounted.value) {
    return firstNonEmptyNavigation(
      initialData.value?.footerNavigation
    )
  }

  return firstNonEmptyNavigation(
    pageData.value?.footerNavigation,
    siteRootData.value?.footerNavigation,
    initialData.value?.footerNavigation
  )
})

const footerSectionsWithCookieSettings = computed<FooterNavItem[]>(() => {
  const sections = footerSections.value.map((section) => ({
    ...section,
    children: [...(section.children ?? [])]
  }))

  if (!sections.length) return sections

  const lastSection = sections[sections.length - 1]
  lastSection.children = [
    ...(lastSection.children ?? []),
    {
      title: cookieSettingsLabel.value,
      isCookieSettings: true
    }
  ]

  return sections
})

const siteTitle = computed(
  () => globalConfig.value?.title || 'RoboCup Germany'
)
const { isModalActive } = useCookieControl()
const activeLocaleCode = computed<'de' | 'en'>(() => {
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
const cookieSettingsLabel = computed(() => (
  activeLocaleCode.value === 'en' ? 'Cookie settings' : 'Cookie-Einstellungen'
))

const { normalize, isExternal } = useCmsLink()

const socialChannelConfig: Array<{ key: SocialChannel; label: string; icon: string }> = [
  { key: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { key: 'youtube', label: 'YouTube', icon: 'i-simple-icons-youtube' },
  { key: 'flickr', label: 'Flickr', icon: 'i-simple-icons-flickr' },
  { key: 'tiktok', label: 'TikTok', icon: 'i-simple-icons-tiktok' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  { key: 'twitter', label: 'Twitter', icon: 'i-simple-icons-twitter' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'i-simple-icons-whatsapp' },
  { key: 'bluesky', label: 'Bluesky', icon: 'i-simple-icons-bluesky' }
]

const socialUrls = computed<SocialUrls>(() => {
  type GlobalConfigSocials = { socials?: SocialUrls; socialUrls?: SocialUrls }

  const siteGlobalConfigValue = globalConfig.value as GlobalConfigSocials | undefined
  const pageGlobalConfig = pageData.value?.globalConfig as GlobalConfigSocials | undefined
  const initialGlobalConfig = initialData.value?.globalConfig as GlobalConfigSocials | undefined

  return (
    siteGlobalConfigValue?.socials ??
    siteGlobalConfigValue?.socialUrls ??
    pageGlobalConfig?.socials ??
    pageGlobalConfig?.socialUrls ??
    initialGlobalConfig?.socials ??
    initialGlobalConfig?.socialUrls ??
    {}
  )
})

const footerLogo = computed(() => globalConfig.value?.siteConfig?.footerLogo ?? null)
const footerLogoSrc = computed(() => (
  siteFooterLogo.value?.src ||
  footerLogo.value?.publicUrl?.trim() ||
  footerLogo.value?.url?.trim() ||
  footerLogo.value?.originalUrl?.trim() ||
  fallbackFooterLogoSrc
))
const footerLogoAlt = computed(() => {
  const alt = siteFooterLogo.value?.alt || footerLogo.value?.alt?.trim() || footerLogo.value?.alternative?.trim()
  return alt || `${siteTitle.value} Logo`
})

const contactName = computed(() => (
  globalConfig.value?.siteConfig?.contact?.name?.trim() ||
  globalConfig.value?.contact?.name?.trim() ||
  ''
))
const contactMail = computed(() => (
  globalConfig.value?.siteConfig?.contact?.mail?.trim() ||
  globalConfig.value?.siteConfig?.contact?.email?.trim() ||
  globalConfig.value?.contact?.mail?.trim() ||
  globalConfig.value?.contact?.email?.trim() ||
  ''
))
const contactPhone = computed(() => (
  globalConfig.value?.siteConfig?.contact?.phone?.trim() ||
  globalConfig.value?.contact?.phone?.trim() ||
  ''
))
const contactMailHref = computed(() => contactMail.value ? `mailto:${contactMail.value}` : '')
const contactPhoneHref = computed(() => {
  const phone = contactPhone.value
  if (!phone) return ''
  return phone.toLowerCase().startsWith('tel:')
    ? phone
    : `tel:${phone.replace(/[^\d+]/g, '')}`
})
const hasContact = computed(() => Boolean(contactName.value || contactMail.value || contactPhone.value))

const socialLinks = computed(() => {
  return socialChannelConfig
    .map((channel) => {
      const href = socialUrls.value[channel.key]?.trim()
      if (!href) return null
      return { ...channel, href }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
})
</script>

<template>
  <footer
    class="mb-12 border-t-4 border-primary bg-white"
    aria-labelledby="footer-heading"
  >
    <h2 id="footer-heading" class="sr-only">Fußbereich</h2>
    <div class="container mx-auto grid gap-9 pt-12 pb-0 lg:grid-cols-[3fr_1fr] lg:items-start">
      <nav
        class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Navigation im Fußbereich"
      >
        <section
          v-for="section in footerSectionsWithCookieSettings"
          :key="section.title"
          class="min-w-0"
        >
          <h3 class="mb-4 text-base font-extrabold leading-tight text-black">{{ section.title }}</h3>
          <ul class="grid list-none gap-3 p-0">
            <li
              v-for="item in section.children ?? []"
              :key="`${section.title}-${item.title}`"
              class="text-base leading-normal text-black"
            >
              <NuxtLink
                v-if="!item.isCookieSettings && item.link"
                :to="normalize(item.link)"
                :target="item.target || undefined"
                :external="isExternal(item.link)"
                class="text-base leading-normal text-black no-underline hover:underline focus-visible:rounded-[2px] focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary"
              >
                {{ item.title }}
              </NuxtLink>
              <button
                v-else-if="item.isCookieSettings"
                type="button"
                class="max-w-full text-left text-base leading-normal text-black no-underline hover:underline focus-visible:rounded-[2px] focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary"
                @click="isModalActive = true"
              >
                {{ item.title }}
              </button>
              <span v-else-if="!item.isCookieSettings">{{ item.title }}</span>
            </li>
          </ul>
        </section>
      </nav>

      <div class="flex flex-col items-center justify-start gap-3">
        <img
          :src="footerLogoSrc"
          :alt="footerLogoAlt"
          class="h-auto w-full max-w-[340px]"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          width="340"
          height="150"
        >
        <address v-if="hasContact" class="not-italic text-center text-sm leading-relaxed text-black">
          <p v-if="contactName" class="font-semibold">{{ contactName }}</p>
          <p v-if="contactMail">
            <a
              :href="contactMailHref"
              class="text-black no-underline hover:underline focus-visible:rounded-[2px] focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary"
            >
              {{ contactMail }}
            </a>
          </p>
          <p v-if="contactPhone">
            <a
              :href="contactPhoneHref"
              class="text-black no-underline hover:underline focus-visible:rounded-[2px] focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary"
            >
              {{ contactPhone }}
            </a>
          </p>
        </address>
        <div v-if="socialLinks.length" class="flex flex-wrap items-center justify-center gap-2">
          <a
            v-for="channel in socialLinks"
            :key="channel.key"
            :href="channel.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${channel.label} öffnen`"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <UIcon :name="channel.icon" class="h-4 w-4" />
            <span class="sr-only">{{ channel.label }}</span>
          </a>
        </div>
        <LanguageSwitcher variant="footer" />
      </div>
    </div>
  </footer>
</template>
