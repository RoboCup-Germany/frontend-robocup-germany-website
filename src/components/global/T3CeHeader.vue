<script setup lang="ts">
import type { T3CeBaseProps, T3Link as T3LinkData } from '@t3headless/nuxt-typo3';

defineOptions({
  inheritAttrs: false
});

interface T3CeHeaderProps extends Omit<T3CeBaseProps, 'headerLink'> {
  header?: string;
  headerLayout?: number;
  headerPosition?: string;
  headerLink?: LinkRef | string | null;
  subheader?: string;
}

const props = withDefaults(defineProps<T3CeHeaderProps>(), {
  header: '',
  headerLayout: 0,
  headerPosition: '',
  headerLink: null,
  subheader: ''
});
</script>

<template>
  <div
    v-if="header && headerLayout !== 100"
    class="t3-ce-header"
  >
    <h2 :class="headerPosition">
      <T3Link v-if="headerLink" :link="(headerLink as T3LinkData | string)">
        {{ header }}
      </T3Link>
      <template v-else>
        {{ header }}
      </template>
    </h2>
    <p v-if="subheader" class="mt-2">
      {{ subheader }}
    </p>
  </div>
</template>
