<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed } from 'vue'
import Button from '~/components/basic/Button.vue'
import Headline from '~/components/basic/Headline.vue'

defineOptions({ inheritAttrs: false })

interface T3CeRcgOpener extends T3CeBaseProps {
  button_link?: LinkRef | null
  button_size?: 'small' | 'medium' | 'large'
  button_text?: string
  color_select?: 'primary' | 'secondary' | 'outline'
  header?: string
  use_image?: 0 | 1 | null
  image?: Array<{
    publicUrl?: string | null
    alt?: string | null
    title?: string | null
    cropVariants?: {
      default?: { publicUrl?: string | null; url?: string | null } | null
      small?: { publicUrl?: string | null; url?: string | null } | null
    } | null
  }> | null
  media?: MediaRef[] | {
    url?: string | null
    publicUrl?: string | null
    originalUrl?: string | null
    cropVariants?: {
      default?: { url?: string | null; publicUrl?: string | null } | null
      small?: { url?: string | null; publicUrl?: string | null } | null
    } | null
  } | null
  media_landscape?: MediaRef[]
  media_portrait?: MediaRef[]
}

const props = withDefaults(defineProps<T3CeRcgOpener>(), {
  button_link: null,
  button_size: 'medium',
  button_text: '',
  color_select: 'primary'
})

const hasButton = computed(() => {
  const label = props.button_text?.trim()
  const link = props.button_link
  const href = link?.url || link?.attr?.href || undefined
  return Boolean(label && href)
})

const firstUrl = (arr?: MediaRef[]) => arr?.[0]?.publicUrl?.trim() || ''
const toUrl = (value?: string | null) => value?.trim() || ''
const isMediaArray = (value: unknown): value is MediaRef[] => Array.isArray(value)

const legacyUrl = computed(() => {
  if (isMediaArray(props.media)) {
    return firstUrl(props.media)
  }
  return toUrl(props.media?.publicUrl || props.media?.url || props.media?.originalUrl)
})
const landscapeUrl = computed(() => firstUrl(props.media_landscape) || (isMediaArray(props.media) ? firstUrl(props.media) : ''))
const portraitUrl = computed(() => firstUrl(props.media_portrait) || (isMediaArray(props.media) ? firstUrl(props.media) : ''))

const useImage = computed(() => {
  return props.use_image === 1
})

const imageDesktopUrl = computed(() => {
  const first = props.image?.[0]
  const fromImage = toUrl(first?.cropVariants?.default?.publicUrl || first?.cropVariants?.default?.url || first?.publicUrl)
  if (fromImage) return fromImage

  if (!isMediaArray(props.media)) {
    return toUrl(
      props.media?.cropVariants?.default?.publicUrl
      || props.media?.cropVariants?.default?.url
      || props.media?.publicUrl
      || props.media?.url
      || props.media?.originalUrl
    )
  }
  return ''
})

const imageMobileUrl = computed(() => {
  const first = props.image?.[0]
  const fromImage = toUrl(
    first?.cropVariants?.small?.publicUrl
    || first?.cropVariants?.small?.url
    || first?.cropVariants?.default?.publicUrl
    || first?.cropVariants?.default?.url
    || first?.publicUrl
  )
  if (fromImage) return fromImage

  if (!isMediaArray(props.media)) {
    return toUrl(
      props.media?.cropVariants?.small?.publicUrl
      || props.media?.cropVariants?.small?.url
      || props.media?.cropVariants?.default?.publicUrl
      || props.media?.cropVariants?.default?.url
      || props.media?.publicUrl
      || props.media?.url
      || props.media?.originalUrl
    )
  }
  return ''
})

const isVideo = (url: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(url)
const isImage = (url: string) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url)
</script>

<template>
  <div class="relative w-full overflow-hidden">
    <template v-if="useImage">
      <img
          v-if="imageMobileUrl"
          :src="imageMobileUrl"
          alt=""
          aria-hidden="true"
          class="block md:hidden w-full h-auto object-contain"
      />
      <img
          v-if="imageDesktopUrl"
          :src="imageDesktopUrl"
          alt=""
          aria-hidden="true"
          class="hidden md:block w-full h-[80vh] object-cover"
      />
      <img
          v-if="!imageMobileUrl && !imageDesktopUrl && legacyUrl && isImage(legacyUrl)"
          :src="legacyUrl"
          alt=""
          aria-hidden="true"
          class="w-full h-auto md:h-[80vh] object-contain md:object-cover"
      />
    </template>

    <template v-else>
    <!-- PORTRAIT: shown on small screens -->
    <video
        v-if="portraitUrl && isVideo(portraitUrl)"
        :src="portraitUrl"
        autoplay
        muted
        playsinline
        loop
        preload="metadata"
        aria-hidden="true"
        tabindex="-1"
        role="presentation"
        class="block md:hidden w-full h-[80vh] object-cover"
    />
    <img
        v-else-if="portraitUrl && isImage(portraitUrl)"
        :src="portraitUrl"
        alt=""
        aria-hidden="true"
        class="block md:hidden w-full h-auto object-contain"
    />

    <!-- LANDSCAPE: shown on md+ screens -->
    <video
        v-if="landscapeUrl && isVideo(landscapeUrl)"
        :src="landscapeUrl"
        autoplay
        muted
        playsinline
        loop
        preload="metadata"
        aria-hidden="true"
        tabindex="-1"
        role="presentation"
        class="hidden md:block w-full h-[80vh]  object-cover"
    />
    <img
        v-else-if="landscapeUrl && isImage(landscapeUrl)"
        :src="landscapeUrl"
        alt=""
        aria-hidden="true"
        class="hidden md:block w-full h-[80vh] object-cover"
    />

    <!-- LEGACY FALLBACK -->
    <video
        v-if="!portraitUrl && !landscapeUrl && legacyUrl && isVideo(legacyUrl)"
        :src="legacyUrl"
        autoplay
        muted
        playsinline
        loop
        preload="metadata"
        aria-hidden="true"
        tabindex="-1"
        role="presentation"
        class="w-full h-[55vh] lg:h-screen object-cover"
    />
    <img
        v-else-if="!portraitUrl && !landscapeUrl && legacyUrl && isImage(legacyUrl)"
        :src="legacyUrl"
        alt=""
        aria-hidden="true"
        class="w-full h-auto md:h-[80vh] object-contain md:object-cover"
    />
    </template>

    <!-- Subtle top-darkening like the reference (NOT full black overlay) -->
    <div
        aria-hidden="true"
        role="presentation"
        class="absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-black/15 to-transparent"
    />

    <!-- Centered headline/content -->
    <div class="absolute inset-0 z-20">
      <UContainer class="h-full flex items-center justify-center text-center">
        <div class="w-full xl:w-2/3">
          <Headline v-if="header" class="mb-7 text-white" :raw-html="header" />
        </div>
      </UContainer>
    </div>

    <!-- White arc at the bottom (wide + flatter like the reference) -->
    <div
        aria-hidden="true"
        role="presentation"
        class="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 z-30 bg-white rounded-[999px]
             w-[180vw] h-[110vw] md:w-[140vw] md:h-[80vw] lg:w-[125vw] lg:h-[38vw]
             translate-y-[89%] 3xl:translate-y-[95%]"
    />

    <!-- Centered CTA button sitting on the white arc -->
    <div
        v-if="hasButton"
        class="absolute z-40 left-1/2 -translate-x-1/2
             bottom-6 md:bottom-8
             px-4 "
    >
      <Button
          :to="button_link"
          :size="button_size"
          :color="color_select"
          :label="button_text"
          class="w-full justify-center"
      />
    </div>
  </div>
</template>
