<script setup lang="ts">
type NavItem = {
  title?: string
  link?: string
  target?: string
  current?: number
  active?: number
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

const siteTitle = computed(() => initialData.value?.globalConfig?.title || 'RoboCup Germany')

const navItems = computed<NavItem[]>(
  () =>
    (pageData.value?.headerNavigation as NavItem[] | undefined) ??
    (initialData.value?.headerNavigation as NavItem[] | undefined) ??
    []
)

const localeItems = computed<LocaleItem[]>(
  () =>
    ((pageData.value?.i18n as LocaleItem[] | undefined) ??
      (initialData.value?.i18n as LocaleItem[] | undefined) ??
      [])
      .filter(locale => locale.available === 1 && !!locale.link && locale.active !== 1)
)

const desktopActiveIndex = computed(() => {
  if (openDesktopIndex.value !== null) return openDesktopIndex.value
  return navItems.value.findIndex(item => item.current === 1 || item.active === 1)
})

const desktopActiveItem = computed(() => {
  if (desktopActiveIndex.value < 0) return null
  return navItems.value[desktopActiveIndex.value] ?? null
})

const hasChildren = (item?: NavItem) => !!item?.children?.length
const isExternal = (href?: string) => !!href && /^(https?:)?\/\//.test(href)

const closeDesktopMenu = () => {
  openDesktopIndex.value = null
}
</script>

<template>
  <header class="relative z-40 border-b-2 border-primary bg-white" @keydown.esc="closeDesktopMenu" @mouseleave="closeDesktopMenu">
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
                  :to="locale.link"
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
                    :class="desktopActiveIndex === index ? 'border-primary' : 'border-transparent hover:border-black/30'"
                    :aria-expanded="desktopActiveIndex === index"
                    :aria-controls="`desktop-submenu-${index}`"
                    @click="openDesktopIndex = desktopActiveIndex === index ? null : index"
                  >
                    {{ item.title }}
                  </button>
                </template>
                <NuxtLink
                  v-else-if="item.link"
                  :to="item.link"
                  :target="item.target || undefined"
                  :external="isExternal(item.link)"
                  class="inline-flex items-center border-b-4 px-0 py-3 text-sm font-semibold text-black no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  :class="item.current === 1 || item.active === 1 ? 'border-primary' : 'border-transparent hover:border-black/30'"
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
          class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/30 text-primary lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="mobile-main-nav"
          aria-label="Hauptmenü öffnen"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <span class="text-lg leading-none" aria-hidden="true">
            {{ isMobileMenuOpen ? '✕' : '☰' }}
          </span>
        </button>
      </div>
    </UContainer>

    <div class="absolute left-0 top-full right-0 z-50 hidden lg:block">
      <div
        v-if="desktopActiveItem && hasChildren(desktopActiveItem)"
        :id="`desktop-submenu-${desktopActiveIndex}`"
        class="border-t border-black/10 bg-white/95"
      >
        <UContainer class="py-8 xl:grid xl:grid-cols-13 xl:gap-8">
          <div class="rounded-md border border-black/10 bg-white p-6 xl:col-start-1 xl:col-end-5">
            <p class="text-lg font-semibold leading-tight text-black">
              {{ desktopActiveItem.title }}
            </p>
            <p class="mt-3 text-sm text-black/80">
              Wähle einen Bereich aus der Navigation.
            </p>
          </div>

          <div class="mt-8 grid gap-8 md:grid-cols-2 xl:col-start-5 xl:col-end-14 xl:mt-0 xl:grid-cols-3">
            <div
              v-for="child in desktopActiveItem.children ?? []"
              :key="`${desktopActiveItem.title}-${child.title}`"
              class="min-w-0"
            >
              <NuxtLink
                v-if="child.link"
                :to="child.link"
                :target="child.target || undefined"
                :external="isExternal(child.link)"
                class="text-base font-semibold text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {{ child.title }}
              </NuxtLink>
              <p v-else class="text-base font-semibold text-black">{{ child.title }}</p>

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
                    :to="grandChild.link"
                    :target="grandChild.target || undefined"
                    :external="isExternal(grandChild.link)"
                    class="text-sm text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

    <div v-if="isMobileMenuOpen" id="mobile-main-nav" class="border-t border-black/10 bg-white lg:hidden">
      <UContainer class="py-5">
        <nav aria-label="Mobile Hauptnavigation">
          <ul class="grid gap-3">
            <li
              v-for="item in navItems"
              :key="`mobile-${item.title}-${item.link}`"
              class="rounded-md border border-black/10 bg-black/5 px-4 py-3"
            >
              <template v-if="hasChildren(item)">
                <details>
                  <summary class="cursor-pointer text-sm font-semibold text-black marker:text-primary">
                    {{ item.title }}
                  </summary>
                  <ul class="mt-3 grid list-none gap-2 p-0">
                    <li
                      v-for="child in item.children ?? []"
                      :key="`mobile-${item.title}-${child.title}`"
                    >
                      <NuxtLink
                        v-if="child.link"
                        :to="child.link"
                        :target="child.target || undefined"
                        :external="isExternal(child.link)"
                        class="text-sm text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        @click="isMobileMenuOpen = false"
                      >
                        {{ child.title }}
                      </NuxtLink>
                      <span v-else class="text-sm text-black">{{ child.title }}</span>

                      <ul
                        v-if="child.children?.length"
                        class="mt-2 grid list-none gap-2 border-l-2 border-black/20 pl-3"
                      >
                        <li
                          v-for="grandChild in child.children"
                          :key="`mobile-${child.title}-${grandChild.title}`"
                        >
                          <NuxtLink
                            v-if="grandChild.link"
                            :to="grandChild.link"
                            :target="grandChild.target || undefined"
                            :external="isExternal(grandChild.link)"
                            class="text-xs text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            @click="isMobileMenuOpen = false"
                          >
                            {{ grandChild.title }}
                          </NuxtLink>
                          <span v-else class="text-xs text-black">{{ grandChild.title }}</span>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </details>
              </template>
              <NuxtLink
                v-else-if="item.link"
                :to="item.link"
                :target="item.target || undefined"
                :external="isExternal(item.link)"
                class="text-sm font-semibold text-black no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="isMobileMenuOpen = false"
              >
                {{ item.title }}
              </NuxtLink>
              <span v-else class="text-sm font-semibold text-black">{{ item.title }}</span>
            </li>
          </ul>
        </nav>
      </UContainer>
    </div>
  </header>
</template>
