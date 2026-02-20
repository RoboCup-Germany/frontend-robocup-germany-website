<script setup lang="ts">
const { headData, pageData, backendLayout, frontendLayout, getPageData } = await useT3Page()
const route = useRoute()
useHead(headData);
watch(() => route.fullPath, getPageData)

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <T3BackendLayout
      :key="route.fullPath"
      v-if="pageData?.content"
      :name="backendLayout"
      :content="pageData.content"
  />
</template>

<style scoped>

</style>
