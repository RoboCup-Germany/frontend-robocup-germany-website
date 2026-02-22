<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  rawHtml?: string
}

const props = withDefaults(defineProps<Props>(), {
  rawHtml: ''
})

const normalizedHeadingHtml = computed(() => {
  const html = props.rawHtml || ''
  if (!html.trim()) return ''

  const normalized = html
    .replace(/<\s*h[1-6](\s[^>]*)?>/gi, (_match, attrs = '') => `<h2${attrs}>`)
    .replace(/<\s*\/\s*h[1-6]\s*>/gi, '</h2>')
    .replace(/<\s*p(\s[^>]*)?>/gi, (_match, attrs = '') => `<h2${attrs}>`)
    .replace(/<\s*\/\s*p\s*>/gi, '</h2>')

  if (!/<\s*h2(\s|>)/i.test(normalized)) {
    return `<h2>${normalized}</h2>`
  }

  return normalized
})
</script>

<template>
  <T3HtmlParser class="rte-content" :content="normalizedHeadingHtml" />
</template>
