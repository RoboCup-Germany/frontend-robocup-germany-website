<script setup lang="ts">
type FooterNavItem = {
  title?: string
  link?: string
  target?: string
  children?: FooterNavItem[]
}

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
</script>

<template>
  <footer
    class="mt-12 border-t-4 border-primary bg-white"
    aria-labelledby="footer-heading"
  >
    <h2 id="footer-heading" class="sr-only">Fußbereich</h2>
    <div class="container mx-auto grid gap-9 py-12 lg:grid-cols-[3fr_1fr] lg:items-start">
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

      <div class="flex items-center justify-start lg:justify-end">
        <img
          src="/assets/RCgermany_Logo.png"
          :alt="`${siteTitle} Logo`"
          class="h-auto w-full max-w-[340px]"
          loading="lazy"
          width="340"
          height="150"
        >
      </div>
    </div>
  </footer>
</template>
