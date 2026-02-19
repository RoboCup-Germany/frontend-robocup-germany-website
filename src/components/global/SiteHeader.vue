<script setup lang="ts">
type NavItem = {
  title?: string
  link?: string
  target?: string
  current?: number
  active?: number
  subtitle?: string
  media?: unknown
  children?: NavItem[]
}

type LocaleItem = {
  title?: string
  link?: string
  available?: number
  active?: number
}

const { initialData, pageData } = useT3Api()

const isMobileMenuOpen = ref(false)
const openDesktopIndex = ref<number | null>(null)
const isMounted = ref(false)
const route = useRoute()

onMounted(() => {
  isMounted.value = true
})

const siteTitle = computed(() => initialData.value?.globalConfig?.title || 'RoboCup Germany')

const navItems = computed<NavItem[]>(
  () => {
    if (!isMounted.value) {
      return (initialData.value?.headerNavigation as NavItem[] | undefined) ?? []
    }

    return (
      (pageData.value?.headerNavigation as NavItem[] | undefined) ??
      (initialData.value?.headerNavigation as NavItem[] | undefined) ??
      []
    )
  }
)

const localeItems = computed<LocaleItem[]>(
  () => {
    const locales = isMounted.value
      ? ((pageData.value?.i18n as LocaleItem[] | undefined) ??
        (initialData.value?.i18n as LocaleItem[] | undefined) ??
        [])
      : ((initialData.value?.i18n as LocaleItem[] | undefined) ?? [])

    return locales.filter(locale => locale.available === 1 && !!locale.link && locale.active !== 1)
  }
)

const currentDesktopIndex = computed(() => {
  return navItems.value.findIndex(item => item.current === 1 || item.active === 1)
})

const desktopHighlightedIndex = computed(() => {
  if (openDesktopIndex.value !== null) return openDesktopIndex.value
  return currentDesktopIndex.value
})

const desktopOpenItem = computed(() => {
  if (openDesktopIndex.value === null) return null
  return navItems.value[openDesktopIndex.value] ?? null
})

type MediaItem = {
  publicUrl?: string | null
  url?: string | null
  originalUrl?: string | null
  alt?: string | null
  alternative?: string | null
  description?: string | null
  title?: string | null
  cropVariants?: {
    default?: {
      url?: string | null
    }
  } | null
}

const megaMenuPreview = computed(() => {
  const openItem = desktopOpenItem.value
  if (!openItem) return null

  const mediaRaw = openItem.media
  const mediaList = Array.isArray(mediaRaw) ? mediaRaw : mediaRaw ? [mediaRaw] : []
  const firstMedia = mediaList[0]

  if (!firstMedia || typeof firstMedia !== 'object') return null

  const media = firstMedia as MediaItem
  const src = media.publicUrl || media.cropVariants?.default?.url || media.url || media.originalUrl
  if (!src) return null

  const alt = media.alt || media.alternative || media.description || media.title || openItem.title || 'Vorschaubild'
  const subtitle = openItem.subtitle || ''

  return { src, alt, subtitle }
})

const hasChildren = (item?: NavItem) => !!item?.children?.length
const { normalize, isExternal } = useCmsLink()

const closeDesktopMenu = () => {
  openDesktopIndex.value = null
}

watch(
  () => route.fullPath,
  () => {
    closeDesktopMenu()
    isMobileMenuOpen.value = false
  }
)
</script>

<template>
  <header class="relative z-[100] overflow-visible border-b-2 border-primary bg-white" @keydown.esc="closeDesktopMenu" @mouseleave="closeDesktopMenu">
    <UContainer>
      <div class="flex items-center justify-between gap-6 py-4 lg:items-end lg:py-5">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-4 no-underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="siteTitle"
        >
          <img
            src="/assets/RCgermany_Logo.png"
            :alt="`${siteTitle} Logo`"
            class="h-auto w-[210px] md:w-[260px]"
            width="260"
            height="110"
          >
        </NuxtLink>

        <div class="hidden flex-1 flex-col items-end gap-2 lg:flex">
          <nav v-if="localeItems.length" aria-label="Sprachauswahl">
            <ul class="flex items-center gap-6">
              <li v-for="locale in localeItems" :key="`${locale.title}-${locale.link}`">
                <NuxtLink
                  v-if="locale.link"
                  :to="normalize(locale.link)"
                  class="text-sm font-semibold text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {{ locale.title }}
                </NuxtLink>
                <span v-else class="text-sm font-semibold text-black">{{ locale.title }}</span>
              </li>
            </ul>
          </nav>

          <nav class="w-full" aria-label="Hauptnavigation">
            <ul class="flex items-end justify-end gap-8 xl:gap-10">
              <li
                v-for="(item, index) in navItems"
                :key="`${item.title}-${item.link}`"
                class="relative"
                @mouseenter="openDesktopIndex = hasChildren(item) ? index : null"
              >
                <template v-if="hasChildren(item)">
                  <button
                    type="button"
                    class="inline-flex items-center border-b-4 px-0 py-3 text-sm font-semibold text-black no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    :class="desktopHighlightedIndex === index ? 'border-primary' : 'border-transparent hover:border-black/30'"
                    :aria-expanded="openDesktopIndex === index"
                    :aria-controls="`desktop-submenu-${index}`"
                    @click="openDesktopIndex = openDesktopIndex === index ? null : index"
                  >
                    {{ item.title }}
                  </button>
                </template>
                <NuxtLink
                  v-else-if="item.link"
                  :to="normalize(item.link)"
                  :target="item.target || undefined"
                  :external="isExternal(item.link)"
                  class="inline-flex items-center border-b-4 px-0 py-3 text-sm font-semibold text-black no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  :class="item.current === 1 || item.active === 1 ? 'border-primary' : 'border-transparent hover:border-black/30'"
                  @click="closeDesktopMenu"
                >
                  {{ item.title }}
                </NuxtLink>
                <span
                  v-else
                  class="inline-flex items-center border-b-4 border-transparent px-0 py-3 text-sm font-semibold text-black"
                >
                  {{ item.title }}
                </span>
              </li>
            </ul>
          </nav>
        </div>

        <button
          type="button"
          class="inline-flex h-12 w-12 items-center justify-center text-primary lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="mobile-main-nav"
          aria-label="Hauptmenü öffnen"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <span class="text-xl leading-none" aria-hidden="true">
            {{ isMobileMenuOpen ? '✕' : '☰' }}
          </span>
        </button>
      </div>
    </UContainer>

    <div class="absolute left-0 top-full right-0 z-50 hidden h-0 lg:block">
      <div
        v-if="desktopOpenItem && hasChildren(desktopOpenItem)"
        :id="`desktop-submenu-${openDesktopIndex}`"
        class="pointer-events-auto border-t border-black/10 bg-white/90 backdrop-blur-sm"
      >
        <UContainer class="py-8 lg:grid lg:grid-cols-12 lg:gap-8">
          <div class="rounded-md border border-black/10 bg-white p-6 lg:col-span-4">
            <img
              v-if="megaMenuPreview"
              :src="megaMenuPreview.src"
              :alt="megaMenuPreview.alt"
              class="h-48 w-full rounded-md object-cover"
              loading="lazy"
              decoding="async"
            >
            <p v-if="megaMenuPreview?.subtitle" class="mt-4 text-sm text-black/80">
              {{ megaMenuPreview.subtitle }}
            </p>
            <p v-else class="text-lg font-semibold leading-tight text-black">
              {{ desktopOpenItem.title }}
            </p>
            <p v-if="!megaMenuPreview" class="mt-3 text-sm text-black/80">
              Wähle einen Bereich aus der Navigation.
            </p>
          </div>

          <div class="mt-8 grid gap-8 md:grid-cols-2 lg:col-span-8 lg:mt-0 xl:grid-cols-3">
            <div
              v-for="child in desktopOpenItem.children ?? []"
              :key="`${desktopOpenItem.title}-${child.title}`"
              class="min-w-0"
            >
              <NuxtLink
                v-if="child.link"
                :to="normalize(child.link)"
                :target="child.target || undefined"
                :external="isExternal(child.link)"
                class="text-base font-semibold text-primary no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="closeDesktopMenu"
              >
                {{ child.title }}
              </NuxtLink>
              <p v-else class="text-base font-semibold text-primary">{{ child.title }}</p>

              <ul
                v-if="child.children?.length"
                class="mt-3 grid list-none gap-2 p-0"
              >
                <li
                  v-for="grandChild in child.children"
                  :key="`${child.title}-${grandChild.title}`"
                >
                  <NuxtLink
                    v-if="grandChild.link"
                    :to="normalize(grandChild.link)"
                    :target="grandChild.target || undefined"
                    :external="isExternal(grandChild.link)"
                    class="text-sm text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    @click="closeDesktopMenu"
                  >
                    {{ grandChild.title }}
                  </NuxtLink>
                  <span v-else class="text-sm text-black">{{ grandChild.title }}</span>
                </li>
              </ul>
            </div>
          </div>
        </UContainer>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      enter-from-class="-translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-300 ease-in-out"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-3 opacity-0"
    >
      <div v-if="isMobileMenuOpen" id="mobile-main-nav" class="absolute left-0 top-full right-0 z-50 border-t border-primary/40 bg-white/95 shadow-lg backdrop-blur-sm lg:hidden">
        <UContainer class="py-2">
          <nav aria-label="Mobile Hauptnavigation">
            <ul class="divide-y divide-black/15">
              <li
                v-for="item in navItems"
                :key="`mobile-${item.title}-${item.link}`"
                class="py-3"
              >
                <template v-if="hasChildren(item)">
                  <details class="group">
                    <summary class="flex w-full cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.14em] text-black marker:hidden">
                      <span>{{ item.title }}</span>
                      <svg
                        viewBox="0 0 1080 1080"
                        class="h-3 w-3 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180"
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
                    <ul class="mt-3 grid list-none gap-3 border-l border-primary/50 pl-4">
                      <li
                        v-for="child in item.children ?? []"
                        :key="`mobile-${item.title}-${child.title}`"
                      >
                        <NuxtLink
                          v-if="child.link"
                          :to="normalize(child.link)"
                          :target="child.target || undefined"
                          :external="isExternal(child.link)"
                          class="inline-flex text-sm text-primary no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          @click="isMobileMenuOpen = false"
                        >
                          {{ child.title }}
                        </NuxtLink>
                        <span v-else class="text-sm text-primary">{{ child.title }}</span>

                        <ul
                          v-if="child.children?.length"
                          class="mt-2 grid list-none gap-2 border-l border-black/35 pl-3"
                        >
                          <li
                            v-for="grandChild in child.children"
                            :key="`mobile-${child.title}-${grandChild.title}`"
                          >
                            <NuxtLink
                              v-if="grandChild.link"
                              :to="normalize(grandChild.link)"
                              :target="grandChild.target || undefined"
                              :external="isExternal(grandChild.link)"
                              class="inline-flex text-xs uppercase tracking-[0.12em] text-black/90 no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                              @click="isMobileMenuOpen = false"
                            >
                              {{ grandChild.title }}
                            </NuxtLink>
                            <span v-else class="text-xs uppercase tracking-[0.12em] text-black/90">{{ grandChild.title }}</span>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </details>
                </template>
                <NuxtLink
                  v-else-if="item.link"
                  :to="normalize(item.link)"
                  :target="item.target || undefined"
                  :external="isExternal(item.link)"
                  class="inline-flex text-sm font-semibold uppercase tracking-[0.14em] text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  @click="isMobileMenuOpen = false"
                >
                  {{ item.title }}
                </NuxtLink>
                <span v-else class="text-sm font-semibold uppercase tracking-[0.14em] text-black">{{ item.title }}</span>
              </li>
            </ul>
          </nav>
        </UContainer>
      </div>
    </Transition>
  </header>
</template>
