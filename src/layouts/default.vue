<script setup lang="ts">
const { initialData } = useT3Api()
const navigation = computed(
    () => initialData.value?.navigation?.[0]?.children ?? []
)
</script>

<template>
  <header v-if="navigation">
    <NuxtLink v-for="{ link, title } in navigation" :key="link" :to="link">
      {{ title }}
    </NuxtLink>
  </header>

  <slot />

  <footer>FOOTER</footer>
</template>

<style scoped>

</style>