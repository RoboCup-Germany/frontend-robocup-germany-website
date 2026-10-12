<script setup lang="ts">
import { computed, ref, useId } from 'vue'

type EventNavigationItem = {
  title?: string
  link?: string
  active?: boolean | number
  current?: boolean | number
  children?: EventNavigationItem[]
}

type EventNavigationData = {
  event?: {
    id?: number | string
    title?: string
    link?: string
  }
  items?: EventNavigationItem[]
}

const props = defineProps<{
  navigation: EventNavigationData
}>()

const isOpen = ref(true)
const menuId = useId()
const { normalize, isExternal } = useCmsLink()

const eventTitle = computed(() => props.navigation.event?.title?.trim() || 'Event')
const navigationItems = computed(() => props.navigation.items ?? [])
const ariaLabel = computed(() => `Archiv-Menü für ${eventTitle.value}`)
const toggleLabel = computed(() => `${ariaLabel.value} ${isOpen.value ? 'schließen' : 'öffnen'}`)

const isSelected = (item: EventNavigationItem) => item.active === true
  || item.active === 1
  || item.current === true
  || item.current === 1

const isCurrentPage = (item: EventNavigationItem) => item.current === true || item.current === 1
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-3 sm:bottom-6 sm:px-5">
    <div class="pointer-events-auto mx-auto flex w-full max-w-md flex-col">
      <Transition
        appear
        appear-active-class="transition duration-300 ease-out"
        appear-from-class="translate-y-3 opacity-0"
        appear-to-class="translate-y-0 opacity-100"
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-3 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-3 opacity-0"
      >
        <nav
          v-if="isOpen"
          :id="menuId"
          :aria-label="ariaLabel"
          class="max-h-[45vh] overflow-y-auto rounded-t-lg border-x border-t border-primary/20 bg-white/95 px-4 pt-4 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:px-5"
        >
          <p class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Archiv-Menü
          </p>
          <h2 class="m-0 text-sm font-semibold leading-tight text-primary">
            <NuxtLink
              v-if="navigation.event?.link"
              :to="normalize(navigation.event.link)"
              :external="isExternal(navigation.event.link)"
              class="text-primary no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="isOpen = false"
            >
              {{ eventTitle }}
            </NuxtLink>
            <template v-else>{{ eventTitle }}</template>
          </h2>

          <ul class="my-3 grid list-none gap-1 p-0">
            <li v-for="item in navigationItems" :key="`${item.title}-${item.link}`">
              <NuxtLink
                v-if="item.link"
                :to="normalize(item.link)"
                :external="isExternal(item.link)"
                :class="isSelected(item) ? 'bg-primary text-white' : 'text-black hover:bg-primary/10 hover:text-primary'"
                :aria-current="isCurrentPage(item) ? 'page' : undefined"
                class="block rounded-sm px-2 py-1.5 text-xs font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="isOpen = false"
              >
                {{ item.title }}
              </NuxtLink>
              <span v-else class="block px-2 py-1.5 text-xs font-semibold text-black">
                {{ item.title }}
              </span>

              <ul v-if="item.children?.length" class="mt-1 grid list-none gap-1 border-l border-primary/35 pl-3">
                <li v-for="child in item.children" :key="`${item.title}-${child.title}-${child.link}`">
                  <NuxtLink
                    v-if="child.link"
                    :to="normalize(child.link)"
                    :external="isExternal(child.link)"
                    :class="isSelected(child) ? 'font-semibold text-primary' : 'text-black hover:text-primary'"
                    :aria-current="isCurrentPage(child) ? 'page' : undefined"
                    class="block rounded-sm px-2 py-1 text-xs no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    @click="isOpen = false"
                  >
                    {{ child.title }}
                  </NuxtLink>
                  <span v-else class="block px-2 py-1 text-xs text-black">{{ child.title }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </Transition>

    <button
      type="button"
      class="flex w-full items-center justify-between gap-4 bg-primary px-4 py-2.5 text-left text-xs font-semibold text-white shadow-[0_6px_18px_-12px_rgba(0,0,0,0.45)] transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5"
      :class="isOpen ? 'rounded-b-lg' : 'rounded-lg'"
      :aria-expanded="isOpen"
      :aria-controls="menuId"
      :aria-label="toggleLabel"
      @click="isOpen = !isOpen"
    >
      <span class="flex min-w-0 flex-col gap-1">
        <span class="text-xs uppercase tracking-[0.12em] text-white/80">Archiv-Menü</span>
        <span class="truncate">{{ eventTitle }}</span>
      </span>
      <svg
        viewBox="0 0 1080 1080"
        class="h-3 w-3 shrink-0 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
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
    </div>
  </div>
</template>
