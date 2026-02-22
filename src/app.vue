<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage :key="route.fullPath" />
    </NuxtLayout>
  </UApp>
</template>

<style scoped>
</style>
