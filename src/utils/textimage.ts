import type { DisplayImage, DisplayImageSize } from '~/utils/media-image';

export type TextImageLayout = 'single' | 'multi' | 'slideshow';

export type TextImageView = {
  src: string;
  srcSmall: string | null;
  srcsetDefault: string | null;
  srcsetSmall: string | null;
  alt: string;
  title: string;
  creator: string;
  width?: number;
  height?: number;
  /** Grid cell in the "multi" layout (6 columns from sm on, 2 columns below). */
  cellClass: string;
  /** Width of the image inside a slide of the "slideshow" layout. */
  slideClass: string;
  /** Maximum image height in the "multi"/"single" layout. */
  imageClass: string;
  sizes: string;
  nuxtSizes: string;
};

type ImageSizeLayout = Pick<TextImageView, 'cellClass' | 'slideClass' | 'imageClass' | 'sizes' | 'nuxtSizes'>;

// The image area is at most 800px wide (one column of the 12-column grid from xl on, ~600px).
// Within it, large = full width, medium = 1/2, small = 1/3. Below sm, large and medium take the
// full width and small takes half. The backend caps the delivered resolution per size accordingly
// (2x of the largest slot, see FileReferenceToArray in the TYPO3 backend).
const IMAGE_SIZE_LAYOUTS: Record<DisplayImageSize, ImageSizeLayout> = {
  large: {
    cellClass: 'col-span-2 sm:col-span-6',
    slideClass: 'w-full',
    imageClass: 'max-h-[520px]',
    sizes: '(min-width: 1280px) 600px, (min-width: 864px) 800px, 100vw',
    nuxtSizes: 'xs:100vw md:800px xl:600px'
  },
  medium: {
    cellClass: 'col-span-2 sm:col-span-3',
    slideClass: 'w-full sm:w-1/2',
    imageClass: 'max-h-[360px]',
    sizes: '(min-width: 1280px) 300px, (min-width: 864px) 400px, (min-width: 640px) 50vw, 100vw',
    nuxtSizes: 'xs:100vw sm:50vw md:400px xl:300px'
  },
  small: {
    cellClass: 'col-span-1 sm:col-span-2',
    slideClass: 'w-1/2 sm:w-1/3',
    imageClass: 'max-h-[240px]',
    sizes: '(min-width: 1280px) 200px, (min-width: 864px) 270px, (min-width: 640px) 33vw, 50vw',
    nuxtSizes: 'xs:50vw sm:33vw md:270px xl:200px'
  }
};

const toPositiveOrUndefined = (value?: number | null): number | undefined => {
  return value && value > 0 ? value : undefined;
};

/**
 * Elements without a stored layout (created before the field existed) show all images.
 */
export const resolveTextImageLayout = (value: unknown): TextImageLayout => {
  return value === 'single' || value === 'slideshow' ? value : 'multi';
};

export const toTextImageViews = (images: DisplayImage[]): TextImageView[] => {
  return images
    .map((image): TextImageView | null => {
      const srcDefault = image.urlDefault || null;
      const srcSmall = image.urlSmall || null;
      const src = srcDefault || srcSmall;

      if (!src) {
        return null;
      }

      return {
        src,
        srcSmall,
        srcsetDefault: image.srcsetDefault || null,
        srcsetSmall: image.srcsetSmall || null,
        alt: image.alt ?? '',
        title: image.title ?? '',
        creator: (image.creator ?? '').trim(),
        width: toPositiveOrUndefined(image.width),
        height: toPositiveOrUndefined(image.height),
        ...IMAGE_SIZE_LAYOUTS[image.imageSize ?? 'large']
      };
    })
    .filter((image): image is TextImageView => Boolean(image));
};
