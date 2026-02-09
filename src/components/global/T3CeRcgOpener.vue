<script setup lang="ts">
import type {T3CeBaseProps} from '@t3headless/nuxt-typo3';
import Button from '~/components/basic/Button.vue';
import Headline from '~/components/basic/Headline.vue';

defineOptions({
  inheritAttrs: false
});

interface T3CeRcgOpener extends T3CeBaseProps
{
  button_link: LinkRef;
  button_size: 'small' | 'medium' | 'large';
  button_text: string;
  color_select: 'primary' | 'secondary' | 'outline';
  header: string;
  media: MediaRef[];
}

const props = withDefaults(defineProps<T3CeRcgOpener>(), {});

</script>

<template>
  <div class="relative w-full overflow-hidden">
    <video
        :src="media[0]?.publicUrl"
        autoplay
        muted
        playsinline
        loop
        preload="auto"
        class="w-full h-[80vh] md:h-[10vh] lg:h-screen object-cover"
    ></video>

    <div class="absolute top-0 left-0 w-full h-full bg-black/50"></div>
    <div class="absolute top-0 left-0 w-full h-full">
      <UContainer class="h-full flex flex-col items-center justify-center text-center grid">
        <div class="col-span-12 xl:col-span-8 xl:col-start-3">
          <Headline
              class="align-text-end mb-7 text-white"
              :raw-html="header"
          />
          <Button
              :to="button_link"
              :size="button_size"
              :color="color_select"
              :label="button_text"
          />
        </div>
      </UContainer>
    </div>
  </div>
</template>