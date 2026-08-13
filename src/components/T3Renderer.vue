<script setup lang="ts">
import { h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type T3ContentElement = {
  id: number | string;
  type: string;
  appearance: {
    frameClass?: string;
    [key: string]: unknown;
  };
  content?: Record<string, unknown>;
};

const props = defineProps({
  content: { type: Array as () => T3ContentElement[], required: false, default: () => [] },
  frame: { type: Boolean, required: false, default: true },
  disableReveal: { type: Boolean, required: false, default: false }
});

const itemRefs = ref<Array<HTMLElement | undefined>>([]);
const mediaQuery = ref<MediaQueryList | null>(null);
const reduceMotion = ref(false);
const revealEnhanced = ref(false);
const visibleIndexes = ref(new Set<number>());
let observer: IntersectionObserver | null = null;

const isFadeOnlyType = (type?: string) => {
  const normalized = String(type || '').toLowerCase();
  return normalized.includes('rcg_image')
    || normalized.includes('rcg_gallery')
    || normalized.includes('rcg_flickrgallery')
    || normalized.includes('rcg_mediaplayer')
    || normalized === 'image'
    || normalized === 'gallery'
    || normalized === 'flickrgallery'
    || normalized === 'flickr_gallery';
};

const isScheduleType = (type?: string) => String(type || '').toLowerCase().includes('schedule');

const isVisible = (index: number, type?: string) => !revealEnhanced.value || props.disableReveal || isScheduleType(type) || visibleIndexes.value.has(index);

const setItemRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    itemRefs.value[index] = el;
    el.dataset.revealIndex = String(index);
    observer?.observe(el);
    return;
  }

  if (!el) {
    itemRefs.value[index] = undefined;
  }
};

const renderComponent = (element: T3ContentElement, index: number) => {
  const { id, type, appearance, content } = element;
  const component = useT3DynamicCe(type);

  return h(component, {
    ...{
      uid: id,
      appearance,
      index
    },
    id: appearance?.frameClass === 'none' ? `c${id}` : null,
    ...(content ?? {})
  });
};

const renderFrame = (element: T3ContentElement, index: number) => {
  const component = useT3DynamicComponent({
    prefix: 'T3',
    type: 'Frame',
    mode: ''
  });

  return h(
    component,
    {
      ...(element.appearance ?? {}),
      id: `c${element.id}`
    },
    {
      default: () => renderComponent(element, index)
    }
  );
};

const revealAll = () => {
  const next = new Set<number>();
  for (let i = 0; i < props.content.length; i += 1) {
    next.add(i);
  }
  visibleIndexes.value = next;
};

const setupObserver = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (props.disableReveal) {
    revealAll();
    observer?.disconnect();
    return;
  }

  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      let changed = false;
      const next = new Set(visibleIndexes.value);

      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        const el = entry.target as HTMLElement;
        const index = Number(el.dataset.revealIndex);
        if (!Number.isNaN(index) && !next.has(index)) {
          next.add(index);
          changed = true;
        }

        observer?.unobserve(el);
      }

      if (changed) {
        visibleIndexes.value = next;
      }

      if (!revealEnhanced.value) {
        revealEnhanced.value = true;
      }
    },
    {
      threshold: 0.04,
      rootMargin: '0px 0px 15% 0px'
    }
  );

  for (const el of itemRefs.value) {
    if (el) {
      observer.observe(el);
    }
  }
};

const handleMotionPreference = (event: MediaQueryListEvent) => {
  reduceMotion.value = event.matches;
  if (reduceMotion.value) {
    revealAll();
    observer?.disconnect();
    return;
  }

  setupObserver();
};

onMounted(async () => {
  if (typeof window === 'undefined') {
    return;
  }

  mediaQuery.value = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduceMotion.value = mediaQuery.value.matches;
  mediaQuery.value.addEventListener('change', handleMotionPreference);

  await nextTick();

  if (reduceMotion.value || props.disableReveal) {
    revealAll();
    revealEnhanced.value = false;
    return;
  }

  setupObserver();
});

watch(
  () => props.content,
  async () => {
    revealEnhanced.value = false;
    visibleIndexes.value = new Set();
    await nextTick();
    if (reduceMotion.value || props.disableReveal) {
      revealAll();
      revealEnhanced.value = false;
      return;
    }
    setupObserver();
  },
  { deep: true }
);

watch(
  () => props.disableReveal,
  async (disabled) => {
    await nextTick();

    if (disabled) {
      revealAll();
      revealEnhanced.value = false;
      observer?.disconnect();
      return;
    }

    visibleIndexes.value = new Set();

    if (reduceMotion.value) {
      revealAll();
      revealEnhanced.value = false;
      return;
    }

    revealEnhanced.value = false;
    setupObserver();
  }
);

onBeforeUnmount(() => {
  if (mediaQuery.value) {
    mediaQuery.value.removeEventListener('change', handleMotionPreference);
  }

  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div class="t3-reveal-list" :class="{ 'is-enhanced': revealEnhanced }">
    <div
      v-for="(component, index) in content"
      :key="index"
      :ref="(el) => setItemRef(el, index)"
      class="t3-reveal-item"
      :class="[
        isScheduleType(component.type)
          ? 'no-reveal'
          : isFadeOnlyType(component.type)
          ? 'reveal-fade-only'
          : (index % 2 === 0 ? 'reveal-from-left' : 'reveal-from-right'),
        isVisible(index, component.type) ? 'is-visible' : ''
      ]"
    >
      <component
        :is="frame && component.appearance?.frameClass !== 'none' ? renderFrame(component, index) : renderComponent(component, index)"
      />
    </div>
  </div>
</template>

<style scoped>
.t3-reveal-list {
  overflow-x: clip;
}

@supports not (overflow: clip) {
  .t3-reveal-list {
    overflow-x: hidden;
  }
}

.t3-reveal-list.is-enhanced .t3-reveal-item {
  opacity: 0;
  transform: translate3d(0, 32px, 0);
  transition: opacity 1050ms cubic-bezier(0.16, 1, 0.3, 1), transform 1250ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.t3-reveal-list.is-enhanced .t3-reveal-item.reveal-from-left {
  transform: translate3d(-84px, 0, 0);
}

.t3-reveal-list.is-enhanced .t3-reveal-item.reveal-from-right {
  transform: translate3d(84px, 0, 0);
}

.t3-reveal-list.is-enhanced .t3-reveal-item.reveal-fade-only {
  transform: translate3d(0, 16px, 0);
}

.t3-reveal-list.is-enhanced .t3-reveal-item.no-reveal {
  opacity: 1;
  transform: none;
  transition: none;
}

.t3-reveal-list.is-enhanced .t3-reveal-item.is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
  .t3-reveal-list.is-enhanced .t3-reveal-item {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

@media (max-width: 767px) {
  .t3-reveal-list.is-enhanced .t3-reveal-item {
    opacity: 1;
    transform: none !important;
    transition: none;
  }
}
</style>
