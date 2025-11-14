<script setup lang="ts">
const { headData, pageData, backendLayout, frontendLayout } = await useT3Page()
useHead(headData);

definePageMeta({
  layout: 'default'
})
</script>

<template>
    <T3BackendLayout
        v-if="pageData?.content"
        :name="backendLayout"
        :content="pageData.content"
    />
</template>

<style scoped>

</style>