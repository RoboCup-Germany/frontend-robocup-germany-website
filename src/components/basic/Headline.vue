<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  rawHtml?: string
}

const props = defineProps<Props>()
</script>

<template>
  <T3HtmlParser :content="rawHtml" />
</template>