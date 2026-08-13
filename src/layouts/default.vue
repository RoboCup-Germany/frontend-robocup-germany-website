<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const nuxtApp = useNuxtApp()
const route = useRoute()

const queryFlagEnabled = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(queryFlagEnabled)
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }

  return value === 1 || value === true
}

const hideChrome = computed(() => queryFlagEnabled(route.query.download))
const isClient = ref(false)
const isApiLoading = ref(false)

if (import.meta.client) {
  isApiLoading.value = Boolean(nuxtApp.isHydrating)

  nuxtApp.hook('page:start', () => {
    isApiLoading.value = true
  })
  nuxtApp.hook('page:finish', () => {
    isApiLoading.value = false
  })
}

onMounted(() => {
  isClient.value = true
})

const showBodyLoader = computed(() => isClient.value && isApiLoading.value)
</script>

<template>
  <SiteHeader v-if="!hideChrome" />
  <main class="layout-body">
    <slot />
    <Transition name="body-loader-fade">
      <div
        v-if="showBodyLoader"
        class="body-loader body-loader--overlay"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="body-loader__spinner" aria-hidden="true" />
      </div>
    </Transition>
  </main>
  <img
    v-if="!hideChrome"
    src="/assets/RCgermany_element2.avif"
    alt=""
    aria-hidden="true"
    class="block aspect-[1080/401] h-auto w-full"
    loading="lazy"
    decoding="async"
    width="1080"
    height="401"
  />
  <SiteFooter v-if="!hideChrome" />
</template>

<style scoped>
.layout-body {
  position: relative;
}

.body-loader {
  min-height: 42vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.body-loader--overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-background) 82%, transparent);
  backdrop-filter: blur(2px);
}

.body-loader__spinner {
  width: 56px;
  height: 56px;
  border: 5px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
  border-top-color: var(--color-primary);
  border-radius: 9999px;
  animation: body-loader-spin 0.8s linear infinite;
}

@keyframes body-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

.body-loader-fade-enter-active,
.body-loader-fade-leave-active {
  transition: opacity 180ms ease;
}

.body-loader-fade-enter-from,
.body-loader-fade-leave-to {
  opacity: 0;
}

</style>
