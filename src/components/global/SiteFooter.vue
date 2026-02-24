<script setup lang="ts">
type FooterNavItem = {
  title?: string
  link?: string
  target?: string
  children?: FooterNavItem[]
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

const { initialData, pageData } = useT3Api()
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

const footerSections = computed<FooterNavItem[]>(() => {
  if (!isMounted.value) {
    return (initialData.value?.footerNavigation as FooterNavItem[] | undefined) ?? []
  }

  return (
    (pageData.value?.footerNavigation as FooterNavItem[] | undefined) ??
    (initialData.value?.footerNavigation as FooterNavItem[] | undefined) ??
    []
  )
})

const siteTitle = computed(
  () => initialData.value?.globalConfig?.title || 'RoboCup Germany'
)

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

  if (!isMounted.value) {
    const globalConfig = initialData.value?.globalConfig as GlobalConfigSocials | undefined
    return globalConfig?.socials ?? globalConfig?.socialUrls ?? {}
  }

  const pageGlobalConfig = pageData.value?.globalConfig as GlobalConfigSocials | undefined
  const initialGlobalConfig = initialData.value?.globalConfig as GlobalConfigSocials | undefined

  return (
    pageGlobalConfig?.socials ??
    pageGlobalConfig?.socialUrls ??
    initialGlobalConfig?.socials ??
    initialGlobalConfig?.socialUrls ??
    {}
  )
})

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
          v-for="section in footerSections"
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
                v-if="item.link"
                :to="normalize(item.link)"
                :target="item.target || undefined"
                :external="isExternal(item.link)"
                class="text-base leading-normal text-black no-underline hover:underline focus-visible:rounded-[2px] focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary"
              >
                {{ item.title }}
              </NuxtLink>
              <span v-else>{{ item.title }}</span>
            </li>
          </ul>
        </section>
      </nav>

      <div class="flex flex-col items-center justify-start gap-3">
        <NuxtImg
          src="/assets/RCgermany_Logo.png"
          :alt="`${siteTitle} Logo`"
          class="h-auto w-full max-w-[340px]"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          width="340"
          height="150"
          sizes="(min-width: 1024px) 340px, 70vw"
          format="webp"
          :quality="80"
        />
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
      </div>
    </div>
  </footer>
</template>
