<script setup lang="ts">
import { computed, ref } from 'vue'

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
  variant: 'mobile' | 'desktop'
}>()

const isOpen = ref(false)
const { normalize, isExternal } = useCmsLink()

const eventTitle = computed(() => props.navigation.event?.title?.trim() || 'Event')
const navigationItems = computed(() => props.navigation.items ?? [])
const ariaLabel = computed(() => `Eventnavigation für ${eventTitle.value}`)

const isSelected = (item: EventNavigationItem) => item.active === true
  || item.active === 1
  || item.current === true
  || item.current === 1

const isCurrentPage = (item: EventNavigationItem) => item.current === true || item.current === 1
</script>

<template>
  <nav
    v-if="variant === 'mobile'"
    :aria-label="ariaLabel"
    class="border-y border-primary/25 bg-primary/5 xl:hidden"
  >
    <UContainer class="py-3">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-4 text-left text-sm font-semibold text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <span>{{ eventTitle }}</span>
        <svg
          viewBox="0 0 1080 1080"
          class="h-4 w-4 shrink-0 transition-transform duration-200"
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

      <ul v-if="isOpen" class="mt-3 grid list-none gap-2 border-l-2 border-primary/30 pl-4">
        <li v-for="item in navigationItems" :key="`${item.title}-${item.link}`">
          <NuxtLink
            v-if="item.link"
            :to="normalize(item.link)"
            :external="isExternal(item.link)"
            :class="isSelected(item) ? 'bg-primary text-white' : 'text-black hover:text-primary'"
            :aria-current="isCurrentPage(item) ? 'page' : undefined"
            class="inline-flex rounded-sm px-2 py-1 text-sm font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="isOpen = false"
          >
            {{ item.title }}
          </NuxtLink>
          <span v-else class="inline-flex px-2 py-1 text-sm font-semibold text-black">
            {{ item.title }}
          </span>

          <ul v-if="item.children?.length" class="mt-2 grid list-none gap-2 border-l border-black/25 pl-3">
            <li v-for="child in item.children" :key="`${item.title}-${child.title}-${child.link}`">
              <NuxtLink
                v-if="child.link"
                :to="normalize(child.link)"
                :external="isExternal(child.link)"
                :class="isSelected(child) ? 'font-semibold text-primary' : 'text-black hover:text-primary'"
                :aria-current="isCurrentPage(child) ? 'page' : undefined"
                class="inline-flex text-xs no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="isOpen = false"
              >
                {{ child.title }}
              </NuxtLink>
              <span v-else class="text-xs text-black">{{ child.title }}</span>
            </li>
          </ul>
        </li>
      </ul>
    </UContainer>
  </nav>

  <nav
    v-else
    :aria-label="ariaLabel"
    class="sticky top-6 hidden border-l-4 border-primary bg-primary/5 px-5 py-6 xl:block"
  >
    <h2 class="m-0 text-base font-semibold leading-tight text-primary">
      <NuxtLink
        v-if="navigation.event?.link"
        :to="normalize(navigation.event.link)"
        :external="isExternal(navigation.event.link)"
        class="text-primary no-underline hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {{ eventTitle }}
      </NuxtLink>
      <template v-else>{{ eventTitle }}</template>
    </h2>

    <ul class="mt-5 grid list-none gap-2 p-0">
      <li v-for="item in navigationItems" :key="`${item.title}-${item.link}`">
        <NuxtLink
          v-if="item.link"
          :to="normalize(item.link)"
          :external="isExternal(item.link)"
          :class="isSelected(item) ? 'bg-primary text-white' : 'text-black hover:bg-primary/10 hover:text-primary'"
          :aria-current="isCurrentPage(item) ? 'page' : undefined"
          class="block rounded-sm px-3 py-2 text-sm font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {{ item.title }}
        </NuxtLink>
        <span v-else class="block px-3 py-2 text-sm font-semibold text-black">
          {{ item.title }}
        </span>

        <ul v-if="item.children?.length" class="mt-2 grid list-none gap-2 border-l border-primary/35 pl-3">
          <li v-for="child in item.children" :key="`${item.title}-${child.title}-${child.link}`">
            <NuxtLink
              v-if="child.link"
              :to="normalize(child.link)"
              :external="isExternal(child.link)"
              :class="isSelected(child) ? 'font-semibold text-primary' : 'text-black hover:text-primary'"
              :aria-current="isCurrentPage(child) ? 'page' : undefined"
              class="block rounded-sm px-2 py-1 text-xs no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {{ child.title }}
            </NuxtLink>
            <span v-else class="block px-2 py-1 text-xs text-black">{{ child.title }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
