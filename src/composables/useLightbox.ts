import { ref } from 'vue';

export interface LightboxImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

const activeImage = ref<LightboxImage | null>(null);

export function useLightbox() {
  function open(image: LightboxImage) {
    if (!image?.src) return;
    activeImage.value = image;
  }

  function close() {
    activeImage.value = null;
  }

  return {
    activeImage,
    open,
    close
  };
}
