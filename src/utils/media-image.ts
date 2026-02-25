export type DisplayImage = {
  urlDefault?: string | null;
  urlSmall?: string | null;
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
};

type CropVariantsLike = {
  default?: CropVariantLike | null;
  small?: CropVariantLike | null;
  [key: string]: CropVariantLike | null | undefined;
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

const normalizeObjectToDisplayImage = (media: MediaObjectLike): DisplayImage | null => {
  const urlDefault
    = variantUrl(media.cropVariants?.default)
      || toTextOrNull(media.publicUrl)
      || toTextOrNull(media.url)
      || toTextOrNull(media.originalUrl)
      || toTextOrNull(media.properties?.originalUrl);
  const urlSmall
    = variantUrl(media.cropVariants?.small)
      || variantUrl(media.cropVariants?.default)
      || urlDefault;

  if (!urlDefault && !urlSmall) {
    return null;
  }

  const description = toTextOrNull(media.description) || toTextOrNull(media.properties?.description);
  const width
    = toPositiveIntOrNull(media.cropVariants?.default?.width)
      || toPositiveIntOrNull(media.width)
      || toPositiveIntOrNull(media.properties?.width);
  const height
    = toPositiveIntOrNull(media.cropVariants?.default?.height)
      || toPositiveIntOrNull(media.height)
      || toPositiveIntOrNull(media.properties?.height);

  return {
    urlDefault,
    urlSmall,
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
