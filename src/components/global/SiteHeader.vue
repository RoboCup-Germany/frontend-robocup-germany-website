<script setup lang="ts">
import { NuxtPicture } from '#components'
type NavItem = {
  uid?: number
  targetUid?: number | null
  title?: string
  link?: string
  target?: string
  current?: number
  active?: number
  subtitle?: string
  media?: unknown
  children?: NavItem[]
}

const { initialData, pageData } = useT3Api()
const { data: siteRootData } = useSiteRootData()

const isMobileMenuOpen = ref(false)
const openDesktopIndex = ref<number | null>(null)
const isMounted = ref(false)
const route = useRoute()
const siteGlobalConfig = useState<GlobalConfig | null>('site-global-config', () => null)
const siteHeaderLogo = useState<{ src: string; alt?: string } | null>('site-header-logo', () => null)

onMounted(() => {
  isMounted.value = true
})

const fallbackHeaderLogoSrc = '/assets/RCgermany_Logo.webp'
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

const siteTitle = computed(() => globalConfig.value?.title || 'RoboCup Germany')
const headerLogo = computed(() => globalConfig.value?.siteConfig?.headerLogo ?? null)
const headerLogoSrc = computed(() => (
  siteHeaderLogo.value?.src ||
  headerLogo.value?.publicUrl?.trim() ||
  headerLogo.value?.url?.trim() ||
  headerLogo.value?.originalUrl?.trim() ||
  fallbackHeaderLogoSrc
))
const headerLogoAlt = computed(() => {
  const alt = siteHeaderLogo.value?.alt || headerLogo.value?.alt?.trim() || headerLogo.value?.alternative?.trim()
  return alt || `${siteTitle.value} Logo`
})
const homeLink = computed(() => (/^\/en(\/|$)/.test(route.path.toLowerCase()) ? '/en' : '/'))

const firstNonEmptyNavigation = (...items: Array<unknown>): NavItem[] => {
  for (const item of items) {
    if (Array.isArray(item) && item.length) {
      return item as NavItem[]
    }
  }

  return []
}

// Page uids from the site root to the current page (current page last), delivered by TYPO3 in the page response.
// T3Page does not declare the project-specific fields, so read them from a plain record.
const pageRecord = computed(() => pageData.value as Record<string, unknown> | null | undefined)
const rootline = computed<number[]>(() => {
  const value = pageRecord.value?.rootline
  return Array.isArray(value)
    ? value.map(Number).filter(uid => Number.isInteger(uid) && uid > 0)
    : []
})
const hasRootline = computed(() => isMounted.value && rootline.value.length > 0)

const navItems = computed<NavItem[]>(
  () => {
    // pageData only exists on the client before mount, so render from the SSR site root data until then.
    if (!isMounted.value) {
      return firstNonEmptyNavigation(
        initialData.value?.headerNavigation,
        siteRootData.value?.headerNavigation
      )
    }

    // With the rootline the menu state is computed here, so the site-wide navigation can be used on every page.
    if (hasRootline.value) {
      return firstNonEmptyNavigation(
        siteRootData.value?.headerNavigation,
        pageRecord.value?.headerNavigation,
        initialData.value?.headerNavigation
      )
    }

    // Backends without rootline: only the page's own navigation carries the right current/active state.
    return firstNonEmptyNavigation(
      pageData.value?.headerNavigation,
      siteRootData.value?.headerNavigation,
      initialData.value?.headerNavigation
    )
  }
)

// Same rules as TYPO3 (AbstractMenuContentObject::isCurrent()): the item or its shortcut target is the current page.
const isCurrentItem = (item: NavItem) => {
  const ids = [item.uid, item.targetUid].filter((uid): uid is number => typeof uid === 'number' && uid > 0)
  if (hasRootline.value && ids.length) {
    return ids.includes(rootline.value[rootline.value.length - 1] as number)
  }

  return item.current === 1
}

const currentDesktopIndex = computed(() => {
  return navItems.value.findIndex(item => isCurrentItem(item))
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

// Entries without own children are stacked in a column of at most PAGES_PER_COLUMN entries; further ones continue
// in the next column. Consecutive entries are grouped so the CMS order is kept. Entries with children stay categories.
type SubmenuGroup =
  | { kind: 'category', key: string, item: NavItem }
  | { kind: 'pages', key: string, items: NavItem[] }

const PAGES_PER_COLUMN = 3
const submenuGroups = computed<SubmenuGroup[]>(() => {
  const groups: SubmenuGroup[] = []
  for (const [index, child] of (desktopOpenItem.value?.children ?? []).entries()) {
    if (hasChildren(child)) {
      groups.push({ kind: 'category', key: `category-${index}-${child.title}`, item: child })
      continue
    }

    const last = groups[groups.length - 1]
    if (last?.kind === 'pages' && last.items.length < PAGES_PER_COLUMN) {
      last.items.push(child)
    } else {
      groups.push({ kind: 'pages', key: `pages-${index}-${child.title}`, items: [child] })
    }
  }

  return groups
})

const { normalize, isExternal } = useCmsLink()

// Hover intent: short delays avoid flicker when the pointer only passes over the navigation.
const HOVER_OPEN_DELAY = 120
const HOVER_CLOSE_DELAY = 200
let hoverTimer: ReturnType<typeof setTimeout> | null = null
// Set when a menu was opened by hovering, so the click that usually follows does not close it again.
const openedByHover = ref(false)

const clearHoverTimer = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
}

const closeDesktopMenu = () => {
  clearHoverTimer()
  openDesktopIndex.value = null
  openedByHover.value = false
}

const onNavItemPointerEnter = (event: PointerEvent, index: number) => {
  // Touch and pen keep the click behaviour; hover only applies to a real mouse.
  if (event.pointerType !== 'mouse') return
  clearHoverTimer()
  const item = navItems.value[index]
  const delay = openDesktopIndex.value === null ? HOVER_OPEN_DELAY : 0
  hoverTimer = setTimeout(() => {
    hoverTimer = null
    if (hasChildren(item)) {
      if (openDesktopIndex.value !== index) openedByHover.value = true
      openDesktopIndex.value = index
    } else {
      openDesktopIndex.value = null
      openedByHover.value = false
    }
  }, delay)
}

const onHeaderPointerEnter = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return
  clearHoverTimer()
}

const onHeaderPointerLeave = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return
  clearHoverTimer()
  hoverTimer = setTimeout(closeDesktopMenu, HOVER_CLOSE_DELAY)
}

const onNavItemClick = (index: number) => {
  clearHoverTimer()
  if (openDesktopIndex.value === index && openedByHover.value) {
    openedByHover.value = false
    return
  }
  openedByHover.value = false
  openDesktopIndex.value = openDesktopIndex.value === index ? null : index
}

// The arrow points down while a submenu is open and only turns up while it fades out on closing.
const ARROW_CLOSE_DURATION = 450
const closingArrowIndex = ref<number | null>(null)
let closingArrowTimer: ReturnType<typeof setTimeout> | null = null

watch(openDesktopIndex, (_current, previous) => {
  if (closingArrowTimer) clearTimeout(closingArrowTimer)
  closingArrowIndex.value = previous ?? null
  closingArrowTimer = setTimeout(() => {
    closingArrowIndex.value = null
    closingArrowTimer = null
  }, ARROW_CLOSE_DURATION)
})

const arrowClass = (index: number) => {
  if (openDesktopIndex.value === index) {
    return 'translate-y-0.5 rotate-0 opacity-100'
  }
  if (closingArrowIndex.value === index) {
    return 'translate-y-0.5 rotate-180 opacity-0 [transition:rotate_300ms_ease-in-out,opacity_250ms_ease-in_200ms]'
  }
  return '-translate-y-1 rotate-0 opacity-0 group-hover:translate-y-0.5 group-hover:opacity-100'
}

onBeforeUnmount(() => {
  clearHoverTimer()
  if (closingArrowTimer) clearTimeout(closingArrowTimer)
})

watch(
  () => route.fullPath,
  () => {
    closeDesktopMenu()
    isMobileMenuOpen.value = false
  }
)
</script>

<template>
  <header class="relative z-[100] overflow-visible border-b-2 border-primary bg-white" @keydown.esc="closeDesktopMenu" @pointerenter="onHeaderPointerEnter" @pointerleave="onHeaderPointerLeave">
    <UContainer>
      <div class="flex items-center justify-between gap-6 py-4 lg:items-end lg:py-5">
        <NuxtLink
          :to="homeLink"
          class="inline-flex items-center gap-4 no-underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="siteTitle"
        >
          <img
            :src="headerLogoSrc"
            :alt="headerLogoAlt"
            class="h-auto max-h-[115px] w-auto max-w-[210px] md:max-w-[260px]"
            width="562"
            height="319"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          >
        </NuxtLink>

        <div class="hidden flex-1 flex-col items-end gap-2 lg:flex">
          <LanguageSwitcher variant="desktop" />

          <nav class="w-full" aria-label="Hauptnavigation">
            <ul class="flex items-end justify-end gap-8 xl:gap-10">
              <li
                v-for="(item, index) in navItems"
                :key="`${item.title}-${item.link}`"
                class="relative shrink-0"
                @pointerenter="onNavItemPointerEnter($event, index)"
              >
                <template v-if="hasChildren(item)">
                  <button
                    type="button"
                    class="group relative inline-flex items-center whitespace-nowrap px-2 py-3 text-sm font-semibold text-black no-underline transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    :aria-expanded="openDesktopIndex === index"
                    :aria-controls="`desktop-submenu-${index}`"
                    @click="onNavItemClick(index)"
                  >
                    <span class="relative z-10">{{ item.title }}</span>
                    <span
                      class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300"
                      :class="desktopHighlightedIndex === index ? 'scale-x-100' : 'group-hover:scale-x-100'"
                      aria-hidden="true"
                    />
                    <svg
                      viewBox="0 0 1080 1080"
                      class="pointer-events-none absolute left-1/2 top-full z-10 h-4 w-4 -translate-x-1/2 text-primary transition-all duration-300 ease-out"
                      :class="arrowClass(index)"
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
                  </button>
                </template>
                <NuxtLink
                  v-else-if="item.link"
                  :to="normalize(item.link)"
                  :target="item.target || undefined"
                  :external="isExternal(item.link)"
                  class="group relative inline-flex items-center whitespace-nowrap rounded-sm px-2 py-3 text-sm font-semibold text-black no-underline transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  @click="closeDesktopMenu"
                >
                  <span class="relative z-10">{{ item.title }}</span>
                  <span
                    class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300"
                    :class="isCurrentItem(item) && openDesktopIndex === null ? 'scale-x-100' : 'group-hover:scale-x-100'"
                    aria-hidden="true"
                  />
                </NuxtLink>
                <span
                  v-else
                  class="group relative inline-flex items-center whitespace-nowrap rounded-sm px-2 py-3 text-sm font-semibold text-black transition-all duration-200"
                >
                  <span class="relative z-10">{{ item.title }}</span>
                  <span
                    class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden="true"
                  />
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
      <!-- Only opening and closing animate; switching between items keeps the panel and swaps its content. -->
      <Transition
        enter-active-class="transition-[opacity,translate] duration-250 ease-out motion-reduce:transition-none"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in motion-reduce:transition-none"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="desktopOpenItem && hasChildren(desktopOpenItem)"
          :id="`desktop-submenu-${openDesktopIndex}`"
          class="pointer-events-auto border-t border-black/10 bg-white/90 shadow-[0_18px_36px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        >
          <UContainer class="py-8 lg:grid lg:grid-cols-12 lg:gap-8">
            <div class="border-r-4 border-primary pr-6 lg:col-span-4">
              <NuxtPicture
                v-if="megaMenuPreview"
                provider="ipx"
                :src="megaMenuPreview.src"
                :alt="megaMenuPreview.alt"
                class="block h-48 w-full"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                sizes="xs:100vw sm:100vw md:100vw lg:33vw"
                format="avif,webp"
                legacy-format="jpeg"
                :quality="80"
                :img-attrs="{ class: 'h-48 w-full rounded-sm object-cover shadow-sm' }"
              />
              <p v-if="megaMenuPreview?.subtitle" class="mt-4 text-base italic tracking-wide text-black font-semibold">
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
                v-for="group in submenuGroups"
                :key="`${desktopOpenItem.title}-${group.key}`"
                class="min-w-0"
              >
                <ul v-if="group.kind === 'pages'" class="grid list-none gap-4 p-0">
                  <li
                    v-for="page in group.items"
                    :key="`${group.key}-${page.title}`"
                  >
                    <NuxtLink
                      v-if="page.link"
                      :to="normalize(page.link)"
                      :target="page.target || undefined"
                      :external="isExternal(page.link)"
                      class="text-base font-semibold text-primary no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      @click="closeDesktopMenu"
                    >
                      {{ page.title }}
                    </NuxtLink>
                    <span v-else class="text-base font-semibold text-primary">{{ page.title }}</span>
                  </li>
                </ul>

                <template v-else>
                  <NuxtLink
                    v-if="group.item.link"
                    :to="normalize(group.item.link)"
                    :target="group.item.target || undefined"
                    :external="isExternal(group.item.link)"
                    class="text-base font-semibold text-primary no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    @click="closeDesktopMenu"
                  >
                    {{ group.item.title }}
                  </NuxtLink>
                  <p v-else class="text-base font-semibold text-primary">{{ group.item.title }}</p>

                  <ul class="mt-3 grid list-none gap-2 p-0">
                    <li
                      v-for="grandChild in group.item.children ?? []"
                      :key="`${group.key}-${grandChild.title}`"
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
                </template>
              </div>
            </div>
          </UContainer>
        </div>
      </Transition>
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
              <li class="py-3">
                <LanguageSwitcher variant="mobile" @select="isMobileMenuOpen = false" />
              </li>
            </ul>
          </nav>
        </UContainer>
      </div>
    </Transition>
  </header>
</template>
