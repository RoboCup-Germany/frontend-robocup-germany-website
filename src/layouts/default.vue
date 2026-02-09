<script setup lang="ts">

import Button from '~/components/basic/Button.vue';

const {initialData} = useT3Api();
const navigation = computed(
    () => initialData.value?.navigation?.[0]?.children ?? []
);
</script>

<template>
  <UHeader>
    <template #right>
      <Button :to="{url: '/'}" label="Contact" size="small" color="secondary"></Button>
    </template>
  </UHeader>
  <slot/>
</template>

<style scoped>

</style>