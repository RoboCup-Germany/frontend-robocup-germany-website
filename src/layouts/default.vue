<script setup lang="ts">
import Button from '~/components/basic/Button.vue';
</script>

<template>
  <UHeader>
    <template #right>
      <Button :to="{url: '/'}" label="Contact" size="small" color="secondary"></Button>
    </template>
  </UHeader>
  <slot/>
  <SiteFooter />
</template>

<style scoped>

</style>
