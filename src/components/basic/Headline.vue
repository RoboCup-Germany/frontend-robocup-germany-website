<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  rawHtml?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const props = withDefaults(defineProps<Props>(), {
  rawHtml: '',
  level: 2
})

const normalizedHeadingHtml = computed(() => {
  const html = props.rawHtml || ''
  const level = props.level

  return html
    .replace(/<\s*h[1-6](\s[^>]*)?>/gi, (_match, attrs = '') => `<h${level}${attrs}>`)
    .replace(/<\s*\/\s*h[1-6]\s*>/gi, `</h${level}>`)
})
</script>

<template>
  <T3HtmlParser class="rte-content" :content="normalizedHeadingHtml" />
</template>
