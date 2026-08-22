import type { Directive, DirectiveBinding } from 'vue';
import { useLightbox, type LightboxImage } from '~/composables/useLightbox';

type LightboxBindingValue = LightboxImage | false | undefined;

function resolveImageElement(el: HTMLElement): HTMLImageElement | null {
  return el.tagName === 'IMG' ? (el as HTMLImageElement) : el.querySelector('img');
}

export const vLightbox: Directive<HTMLElement, LightboxBindingValue> = {
  mounted(el, binding: DirectiveBinding<LightboxBindingValue>) {
    (el as unknown as { __lightboxValue?: LightboxBindingValue }).__lightboxValue = binding.value;

    const img = resolveImageElement(el);
    if (!img) return;

    if (binding.value !== false) {
      img.style.cursor = 'zoom-in';
    }

    const handler = () => {
      const override = (el as unknown as { __lightboxValue?: LightboxBindingValue }).__lightboxValue;
      if (override === false) return;

      const { open } = useLightbox();
      open({
        src: override?.src || img.currentSrc || img.src,
        alt: override?.alt ?? img.alt ?? '',
        width: override?.width ?? (img.naturalWidth || undefined),
        height: override?.height ?? (img.naturalHeight || undefined)
      });
    };

    (el as unknown as { __lightboxHandler?: () => void }).__lightboxHandler = handler;
    el.addEventListener('click', handler);
  },

  updated(el, binding: DirectiveBinding<LightboxBindingValue>) {
    (el as unknown as { __lightboxValue?: LightboxBindingValue }).__lightboxValue = binding.value;

    const img = resolveImageElement(el);
    if (img) {
      img.style.cursor = binding.value === false ? '' : 'zoom-in';
    }
  },

  beforeUnmount(el) {
    const handler = (el as unknown as { __lightboxHandler?: () => void }).__lightboxHandler;
    if (handler) {
      el.removeEventListener('click', handler);
    }
  }
};