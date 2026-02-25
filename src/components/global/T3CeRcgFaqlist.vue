<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';

defineOptions({
  inheritAttrs: false
});

interface FaqElement {
  headline?: string;
  bodytext?: string;
}

interface FaqList {
  title?: string;
  faqelement?: FaqElement[];
}

interface T3CeRcgFaqlist extends T3CeBaseProps {
  header?: string;
  subheader?: string;
  list?: FaqList;
  // eslint-disable-next-line vue/prop-name-casing
  space_before_class?: string;
  // eslint-disable-next-line vue/prop-name-casing
  space_after_class?: string;
}

const props = withDefaults(defineProps<T3CeRcgFaqlist>(), {
  header: '',
  subheader: '',
  list: () => ({ title: '', faqelement: [] }),
  space_before_class: '',
  space_after_class: ''
});

const headingId = computed(() => `faq-heading-${props.uid ?? 'content'}`);
const accordionItems = computed(() =>
  (props.list?.faqelement ?? []).map((item, index) => ({
    label: item.headline || `FAQ ${index + 1}`,
    bodytext: item.bodytext || '',
    value: `faq-item-${props.uid ?? 'content'}-${index}`
  }))
);
</script>

<template>
  <section :class="[space_before_class, space_after_class]" :aria-labelledby="header ? headingId : undefined">
    <UContainer>
      <SectionHeader
        :header="header"
        :subheader="subheader"
        :heading-id="headingId"
        container-class="w-full"
        header-no-subheader-class="mb-4"
        subheader-class="mb-7 text-base italic uppercase tracking-wide text-black font-semibold"
      />

      <div class="w-full xl:w-2/3">
        <div class="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
          <div
            v-if="list?.title"
            class="px-5 py-3 text-sm uppercase tracking-wide font-semibold text-primary border-b border-black/10 bg-black/[0.02]"
          >
            {{ list.title }}
          </div>

          <UAccordion
            v-if="accordionItems.length"
            :items="accordionItems"
            :unmount-on-hide="false"
            type="single"
            collapsible
            :ui="{
              root: '',
              item: 'group border-b border-black/10 last:border-b-0',
              trigger: 'w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-black/[0.02] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
              label: 'text-base font-semibold leading-snug text-black',
              content: 'p-0',
              body: 'p-0 text-sm text-black/90'
            }"
          >
            <template #trailing="{ open }">
              <span
                :class="[
                  'grid place-items-center w-8 h-8 min-w-8 shrink-0 rounded-full border transition-all duration-200 ease-out',
                  open ? 'bg-primary text-white border-primary rotate-45' : 'text-primary border-primary/35'
                ]"
              >
                <UIcon name="i-lucide-plus" class="size-4" />
              </span>
            </template>

            <template #body="{ item, open }">
              <div
                :class="[
                  'faq-answer px-5 py-5 transition-opacity duration-200 ease-out',
                  open ? 'opacity-100' : 'opacity-80'
                ]"
              >
                <T3HtmlParser class="rte-content" v-if="item.bodytext" :content="item.bodytext" />
              </div>
            </template>
          </UAccordion>
        </div>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.faq-answer :deep(p),
.faq-answer :deep(li) {
  font-size: var(--text-sm);
}
</style>
