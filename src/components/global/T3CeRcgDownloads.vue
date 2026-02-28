<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3'
import { computed } from 'vue'
import SectionHeader from '~/components/basic/SectionHeader.vue'

defineOptions({ inheritAttrs: false })

type DownloadFile = {
  publicUrl?: string | null
  originalUrl?: string | null
  filename?: string | null
}

type DownloadItem = {
  headline?: string
  description?: string
  file?: DownloadFile[] | null
}

interface T3CeRcgDownloadsProps extends T3CeBaseProps {
  header?: string
  subheader?: string
  downloads?: DownloadItem[] | null
  space_before_class?: string
  space_after_class?: string
}

const props = withDefaults(defineProps<T3CeRcgDownloadsProps>(), {
  header: '',
  subheader: '',
  downloads: () => [],
  space_before_class: '',
  space_after_class: ''
})

const route = useRoute()

const localizedButtonLabel = computed(() => {
  const isEnglishPage = route.path === '/en' || route.path.startsWith('/en/')
  return isEnglishPage ? 'Download' : 'Herunterladen'
})

const localizedUntitledLabel = computed(() => {
  const isEnglishPage = route.path === '/en' || route.path.startsWith('/en/')
  return isEnglishPage ? 'Untitled file' : 'Datei ohne Titel'
})

const localizedNoDescriptionLabel = computed(() => {
  const isEnglishPage = route.path === '/en' || route.path.startsWith('/en/')
  return isEnglishPage ? 'No description available.' : 'Keine Beschreibung vorhanden.'
})

const localizedDownloadUnavailableLabel = computed(() => {
  const isEnglishPage = route.path === '/en' || route.path.startsWith('/en/')
  return isEnglishPage ? 'Download unavailable.' : 'Download nicht verfuegbar.'
})

const localizedOpenPdfHint = computed(() => {
  const isEnglishPage = route.path === '/en' || route.path.startsWith('/en/')
  return isEnglishPage ? 'Opens in a new tab and can be downloaded.' : 'Oeffnet in einem neuen Tab und kann heruntergeladen werden.'
})

const spacingClasses = computed(() => [props.space_before_class, props.space_after_class].filter(Boolean))

const downloadItems = computed(() => {
  const items = Array.isArray(props.downloads) ? props.downloads : []

  return items
    .map((item, index) => {
      const title = item?.headline?.trim() || ''
      const description = item?.description?.trim() || ''
      const firstFile = Array.isArray(item?.file) ? item.file[0] : null
      const url = firstFile?.publicUrl?.trim() || firstFile?.originalUrl?.trim() || ''
      const fileName = firstFile?.filename?.trim() || ''

      if (!title && !description) {
        return null
      }

      return {
        title,
        description,
        href: url || null,
        fileName,
        downloadName: fileName || undefined,
        titleId: `download-title-${index}`,
        descriptionId: `download-description-${index}`,
        downloadAriaLabel: fileName
          ? `${localizedButtonLabel.value}: ${fileName}`
          : `${localizedButtonLabel.value}: ${title || localizedUntitledLabel.value}`
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

      <ul v-if="downloadItems.length > 0" class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <li
          v-for="(item, index) in downloadItems"
          :key="`${item.title}-${index}`"
          class="h-full"
        >
          <article
            class="group flex h-full overflow-hidden rounded-sm bg-white shadow-[0_16px_34px_rgba(0,0,0,0.12)]"
            :aria-labelledby="item.titleId"
            :aria-describedby="item.descriptionId"
          >
            <div class="flex aspect-square w-28 shrink-0 items-center justify-center bg-primary/10 sm:w-36 lg:w-40" aria-hidden="true">
              <UIcon
                name="i-lucide-download"
                class="h-10 w-10 text-primary transition-transform duration-200 ease-out group-hover:translate-y-0.5 group-hover:scale-110 group-focus-within:translate-y-0.5 group-focus-within:scale-110"
              />
            </div>

            <div class="flex min-w-0 flex-1 flex-col p-4">
              <h3 :id="item.titleId" class="download-title download-title-h4 mt-0 mb-0 !text-black">
                {{ item.title || localizedUntitledLabel }}
              </h3>

              <p :id="item.descriptionId" class="download-subtitle mt-3 mb-0 text-sm text-black/85">
                {{ item.description || localizedNoDescriptionLabel }}
              </p>

              <p v-if="item.fileName" class="mt-3 mb-0 text-xs text-black/60">
                {{ item.fileName }}
              </p>

              <div class="mt-auto flex justify-end pt-4">
                <UButton
                  v-if="item.href"
                  size="sm"
                  color="primary"
                  variant="solid"
                  :to="item.href"
                  target="_blank"
                  rel="noopener"
                  :download="item.downloadName || true"
                  :aria-label="item.downloadAriaLabel"
                >
                  {{ localizedButtonLabel }}
                </UButton>
                <p v-else class="mb-0 text-sm text-black/70">
                  {{ localizedDownloadUnavailableLabel }}
                </p>
              </div>

              <p v-if="item.href" class="sr-only">
                {{ localizedOpenPdfHint }}
              </p>
            </div>
          </article>
        </li>
      </ul>
    </UContainer>
  </section>
</template>

<style scoped>
.download-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.download-title-h4 {
  font-family: var(--font-sans);
  font-style: italic;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: var(--leading-tight);
  font-size: var(--text-sm);
}

.download-subtitle {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
</style>
