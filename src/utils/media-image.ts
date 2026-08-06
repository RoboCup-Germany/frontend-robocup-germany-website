export type DisplayImage = {
  urlDefault?: string | null;
  urlSmall?: string | null;
  srcsetDefault?: string | null;
  srcsetSmall?: string | null;
  alt?: string | null;
  title?: string | null;
  creator?: string | null;
  description?: string | null;
  width?: number | null;
  height?: number | null;
};

type CropVariantLike = {
  url?: string | null;
  publicUrl?: string | null;
  width?: number | string | null;
  height?: number | string | null;
  dimensions?: {
    width?: number | string | null;
    height?: number | string | null;
  } | null;
  properties?: {
    dimensions?: {
      width?: number | string | null;
      height?: number | string | null;
    } | null;
  } | null;
};

type CropVariantsLike = {
  default?: CropVariantLike | null;
  small?: CropVariantLike | null;
  [key: string]: CropVariantLike | null | undefined;
};

type ResponsiveSourceLike = {
  width?: number | string | null;
  height?: number | string | null;
  url?: string | null;
  publicUrl?: string | null;
};

type ResponsiveVariantLike = {
  srcset?: string | null;
  sources?: ResponsiveSourceLike[] | null;
};

type ResponsiveLike = {
  default?: ResponsiveVariantLike | null;
  small?: ResponsiveVariantLike | null;
  [key: string]: ResponsiveVariantLike | null | undefined;
};

type MediaObjectLike = {
  publicUrl?: string | null;
  url?: string | null;
  originalUrl?: string | null;
  title?: string | null;
  alternative?: string | null;
  description?: string | null;
  alt?: string | null;
  creator?: string | null;
  width?: number | string | null;
  height?: number | string | null;
  cropVariants?: CropVariantsLike | null;
  responsive?: ResponsiveLike | null;
  properties?: {
    title?: string | null;
    alternative?: string | null;
    description?: string | null;
    originalUrl?: string | null;
    width?: number | string | null;
    height?: number | string | null;
  } | null;
  content?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const toTextOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const variantUrl = (variant: CropVariantLike | null | undefined): string | null => {
  if (!variant) return null;
  return toTextOrNull(variant.publicUrl) || toTextOrNull(variant.url);
};

const toPositiveIntOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const variantDimension = (
  variant: CropVariantLike | null | undefined,
  key: 'width' | 'height'
): number | null => {
  if (!variant) return null;

  return toPositiveIntOrNull(variant[key])
    || toPositiveIntOrNull(variant.dimensions?.[key])
    || toPositiveIntOrNull(variant.properties?.dimensions?.[key]);
};

const responsiveSrcset = (variant: ResponsiveVariantLike | null | undefined): string | null => {
  return toTextOrNull(variant?.srcset);
};

const responsiveFallbackUrl = (
  variant: ResponsiveVariantLike | null | undefined,
  minimumWidth = 0
): string | null => {
  if (!Array.isArray(variant?.sources) || variant.sources.length === 0) return null;

  const sortedSources = variant.sources
    .map((source) => ({
      url: toTextOrNull(source.url) || toTextOrNull(source.publicUrl),
      width: toPositiveIntOrNull(source.width) || Number.MAX_SAFE_INTEGER
    }))
    .filter((source): source is { url: string; width: number } => Boolean(source.url))
    .sort((a, b) => a.width - b.width);

  return sortedSources.find((source) => source.width >= minimumWidth)?.url
    || sortedSources[sortedSources.length - 1]?.url
    || null;
};

const responsiveFallbackSource = (
  variant: ResponsiveVariantLike | null | undefined,
  minimumWidth = 0
): { url: string; width: number | null; height: number | null } | null => {
  if (!Array.isArray(variant?.sources) || variant.sources.length === 0) return null;

  const sortedSources = variant.sources
    .map((source) => ({
      url: toTextOrNull(source.url) || toTextOrNull(source.publicUrl),
      width: toPositiveIntOrNull(source.width),
      height: toPositiveIntOrNull(source.height)
    }))
    .filter((source): source is { url: string; width: number | null; height: number | null } => Boolean(source.url))
    .sort((a, b) => (a.width || Number.MAX_SAFE_INTEGER) - (b.width || Number.MAX_SAFE_INTEGER));

  return sortedSources.find((source) => (source.width || Number.MAX_SAFE_INTEGER) >= minimumWidth)
    || sortedSources[sortedSources.length - 1]
    || null;
};

const normalizeObjectToDisplayImage = (media: MediaObjectLike): DisplayImage | null => {
  const srcsetDefault = responsiveSrcset(media.responsive?.default);
  const srcsetSmall = responsiveSrcset(media.responsive?.small);
  const responsiveDefault = responsiveFallbackSource(media.responsive?.default, 768);
  const responsiveSmall = responsiveFallbackSource(media.responsive?.small, 320);
  const urlDefault
    = responsiveDefault?.url
      || variantUrl(media.cropVariants?.default)
      || toTextOrNull(media.publicUrl)
      || toTextOrNull(media.url)
      || toTextOrNull(media.originalUrl)
      || toTextOrNull(media.properties?.originalUrl);
  const urlSmall
    = responsiveSmall?.url
      || responsiveFallbackUrl(media.responsive?.default, 320)
      || variantUrl(media.cropVariants?.small)
      || variantUrl(media.cropVariants?.default)
      || urlDefault;

  if (!urlDefault && !urlSmall) {
    return null;
  }

  const description = toTextOrNull(media.description) || toTextOrNull(media.properties?.description);
  const width
    = variantDimension(media.cropVariants?.default, 'width')
      || responsiveDefault?.width
      || responsiveSmall?.width
      || toPositiveIntOrNull(media.width)
      || toPositiveIntOrNull(media.properties?.width);
  const height
    = variantDimension(media.cropVariants?.default, 'height')
      || responsiveDefault?.height
      || responsiveSmall?.height
      || toPositiveIntOrNull(media.height)
      || toPositiveIntOrNull(media.properties?.height);

  return {
    urlDefault,
    urlSmall,
    srcsetDefault,
    srcsetSmall,
    alt:
      toTextOrNull(media.alt)
      || toTextOrNull(media.alternative)
      || description
      || toTextOrNull(media.properties?.alternative)
      || toTextOrNull(media.properties?.description)
      || null,
    title:
      toTextOrNull(media.title)
      || description
      || toTextOrNull(media.properties?.title)
      || null,
    creator: toTextOrNull(media.creator) || null,
    description: description || null,
    width,
    height
  };
};

export const toDisplayImage = (item: unknown): DisplayImage | null => {
  if (!isRecord(item)) return null;

  if (isRecord(item.content)) {
    const fromContent = normalizeObjectToDisplayImage(item.content as MediaObjectLike);
    if (fromContent) {
      return fromContent;
    }
  }

  return normalizeObjectToDisplayImage(item as MediaObjectLike);
};

export const pickFirstDisplayImage = (items: unknown[] | null | undefined): DisplayImage | null => {
  if (!items || items.length === 0) return null;

  for (const item of items) {
    const parsed = toDisplayImage(item);
    if (parsed) return parsed;
  }

  return null;
};

export const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const extractArrayFromUnknown = (
  input: unknown,
  candidateKeys: string[] = ['gallery', 'images', 'media', 'items', 'data']
): unknown[] => {
  const value = parseMaybeJson(input);

  if (Array.isArray(value)) return value;

  if (isRecord(value)) {
    for (const key of candidateKeys) {
      const candidate = value[key];
      if (Array.isArray(candidate)) return candidate;
    }

    const asImage = toDisplayImage(value);
    if (asImage) return [value];
  }

  return [];
};

const isImageLike = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return Boolean(toDisplayImage(value));
};

export const findImageLikeDeep = (input: unknown): unknown[] => {
  const out: unknown[] = [];
  const seen = new WeakSet<object>();

  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (seen.has(value as object)) return;
    seen.add(value as object);

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (isImageLike(value)) {
      out.push(value);
      return;
    }

    for (const child of Object.values(value as Record<string, unknown>)) {
      walk(child);
    }
  };

  walk(input);
  return out;
};
