<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed } from 'vue'
import Button from '~/components/basic/Button.vue'
import SectionHeader from '~/components/basic/SectionHeader.vue'
import { pickFirstDisplayImage } from '~/utils/media-image'

defineOptions({ inheritAttrs: false })

type TeaserLink = {
  title?: string
  subtitle?: string
  media?: unknown[] | null
  link?: string | null
}

interface T3CeRcgPageteaserProps extends T3CeBaseProps {
  header?: string
  subheader?: string
  links?: TeaserLink[] | null
  space_before_class?: string
  space_after_class?: string
}

const props = withDefaults(defineProps<T3CeRcgPageteaserProps>(), {
  header: '',
  subheader: '',
  links: () => [],
  space_before_class: '',
  space_after_class: ''
})

const route = useRoute()
const { normalize, isExternal } = useCmsLink()

const extractT3PageUid = (value?: string | null): number | null => {
  if (!value) return null
  const match = value.trim().match(/^t3:\/\/page\?(.+)$/i)
  if (!match) return null

  const params = new URLSearchParams(match[1])
  const uid = Number(params.get('uid'))
  return Number.isFinite(uid) ? uid : null
}

const t3PageUids = computed(() => {
  const unique = new Set<number>()
  const items = Array.isArray(props.links) ? props.links : []

  items.forEach((item) => {
    const uid = extractT3PageUid(item?.link)
    if (uid !== null) unique.add(uid)
  })

  return [...unique]
})

const { data: resolvedT3PageLinks } = await useAsyncData<Record<number, string>>(
  () => `pageteaser-links:${t3PageUids.value.join(',')}`,
  async () => {
    const result: Record<number, string> = {}

    await Promise.all(
      t3PageUids.value.map(async (uid) => {
        try {
          const page = await $fetch<{ slug?: string }>('/api/typo3/', {
            query: { id: uid }
          })
          const slug = typeof page?.slug === 'string' ? page.slug.trim() : ''
          result[uid] = slug || '/'
        }
        catch {
          result[uid] = '/'
        }
      })
    )

    return result
  },
  { default: () => ({}) }
)

const resolveHref = (value?: string | null): string | undefined => {
  const raw = value?.trim()
  if (!raw) return undefined

  const recordMatch = raw.match(/^t3:\/\/record\?(.+)$/i)
  if (recordMatch) {
    const params = new URLSearchParams(recordMatch[1])
    const identifier = (params.get('identifier') || '').toLowerCase()

    if (identifier === 'rcgpost' || identifier.includes('news')) {
      return '/news'
    }
  }

  const t3Uid = extractT3PageUid(raw)
  const resolved = t3Uid !== null ? (resolvedT3PageLinks.value[t3Uid] || '/') : raw
  const normalized = normalize(resolved)

  if (!normalized || normalized.startsWith('t3://')) {
    return undefined
  }

  return normalized
}

const resolveImage = (item: TeaserLink) => pickFirstDisplayImage(Array.isArray(item.media) ? item.media : [])

const localizedButtonLabel = computed(() => {
  const isEnglishPage = route.path === '/en' || route.path.startsWith('/en/')
  return isEnglishPage ? 'Go to page' : 'Zur Seite'
})

const spacingClasses = computed(() => [props.space_before_class, props.space_after_class].filter(Boolean))

const teaserItems = computed(() => {
  const items = Array.isArray(props.links) ? props.links : []

  return items
    .map((item) => {
      const title = item?.title?.trim() || ''
      const subtitle = item?.subtitle?.trim() || ''
      const href = resolveHref(item?.link)
      const image = resolveImage(item || {})

      if (!title && !subtitle) {
        return null
      }

      return {
        title,
        subtitle,
        to: href
          ? {
              url: href,
              target: isExternal(href) ? '_blank' : null
            } as LinkRef
          : null,
        imageSrc: image?.urlDefault || image?.urlSmall || '',
        imageAlt: image?.alt || image?.title || title || 'Teaser Bild'
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
})
</script>

<template>
  <section :class="spacingClasses">
    <UContainer>
      <SectionHeader
        :header="header"
        :subheader="subheader"
        container-class="mb-7 lg:mb-9"
        subheader-class="mb-0 text-base text-black/80"
      />

      <ul v-if="teaserItems.length > 0" class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <li
          v-for="(item, index) in teaserItems"
          :key="`${item.title}-${index}`"
          class="h-full"
        >
          <article class="flex h-full overflow-hidden rounded-sm bg-white shadow-[0_16px_34px_rgba(0,0,0,0.12)]">
            <div class="relative aspect-square w-28 shrink-0 overflow-hidden bg-black/5 sm:w-36 lg:w-40">
              <NuxtPicture
                provider="ipx"
                v-if="item.imageSrc"
                :src="item.imageSrc"
                :alt="item.imageAlt"
                class="block h-full w-full"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                sizes="100vw md:50vw lg:33vw"
                format="avif,webp"
                legacy-format="jpeg"
                :quality="80"
                :img-attrs="{ class: 'h-full w-full object-cover' }"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-sm text-black/55">
                Kein Bild
              </div>
            </div>

            <div class="flex min-w-0 flex-1 flex-col p-4">
              <p class="pageteaser-title pageteaser-title-h4 mt-0 mb-0 !text-black">
                {{ item.title || '\u00A0' }}
              </p>

              <p class="pageteaser-subtitle mt-3 mb-0 text-sm text-black/85">
                {{ item.subtitle || '\u00A0' }}
              </p>

              <div class="mt-auto pt-4">
                <Button
                  v-if="item.to"
                  :to="item.to"
                  :label="localizedButtonLabel"
                  size="small"
                />
              </div>
            </div>
          </article>
        </li>
      </ul>
    </UContainer>
  </section>
</template>

<style scoped>
.pageteaser-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.pageteaser-title-h4 {
  font-family: var(--font-sans);
  font-style: italic;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: var(--leading-tight);
  font-size: var(--text-sm);
}

.pageteaser-subtitle {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
</style>
