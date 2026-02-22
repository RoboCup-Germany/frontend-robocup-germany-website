<script setup lang="ts">
import { computed } from 'vue';
import Headline from '~/components/basic/Headline.vue';

interface Props {
  header?: string;
  subheader?: string;
  headingId?: string;
  containerClass?: string;
  headerClass?: string;
  headerNoSubheaderClass?: string;
  subheaderClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  header: '',
  subheader: '',
  headingId: undefined,
  containerClass: '',
  headerClass: '',
  headerNoSubheaderClass: '',
  subheaderClass: 'mb-6 text-base italic uppercase tracking-wide text-black font-semibold'
});

const hasHeaderContent = computed(() => Boolean(props.header || props.subheader));
</script>

<template>
  <div v-if="hasHeaderContent" :class="containerClass">
    <div
      v-if="header"
      :id="headingId"
      :class="[headerClass, !subheader ? headerNoSubheaderClass : '']"
    >
      <Headline :raw-html="header" />
    </div>
    <div v-if="subheader" :class="subheaderClass">
      <T3HtmlParser class="rte-content" :content="subheader" />
    </div>
  </div>
</template>
