import { createError, defineEventHandler, getQuery } from 'h3'

interface FlickrApiPhoto {
  id: string
  title?: string
  secret: string
  server: string
  farm: number
  url_q?: string
  url_m?: string
  url_z?: string
  url_l?: string
  url_o?: string
  width_q?: number | string
  width_m?: number | string
  width_z?: number | string
  width_l?: number | string
  width_o?: number | string
  height_q?: number | string
  height_m?: number | string
  height_z?: number | string
  height_l?: number | string
  height_o?: number | string
  o_width?: number | string
  o_height?: number | string
}

interface FlickrApiResponse {
  stat: 'ok' | 'fail'
  message?: string
  code?: number
  photoset?: {
    id: string
    title?: string
    page?: number | string
    pages?: number | string
    perpage?: number | string
    total?: number | string
    photo?: FlickrApiPhoto[]
  }
}

const parsePositiveInt = (value: unknown, fallback: number, max: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

const buildPhotoUrl = (photo: FlickrApiPhoto, size: string): string => {
  return `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_${size}.jpg`
}

const pickFirst = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    if (value && value.trim()) return value
  }
  return ''
}

const pickFirstPositiveInt = (...values: Array<number | string | undefined>): number | null => {
  for (const value of values) {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig(event)

  const photosetId = String(query.photosetId ?? '').trim()
  const fallbackUserId = String(
    config.flickrUserId
    || process.env.NUXT_FLICKR_USER_ID
    || process.env.FLICKR_USER_ID
    || ''
  ).trim()
  const userId = String(query.userId ?? fallbackUserId).trim()
  const perPage = parsePositiveInt(query.perPage, 30, 200)
  const page = parsePositiveInt(query.page, 1, 4000)
  const apiKey = String(
    config.flickrApiKey
    || process.env.NUXT_FLICKR_API_KEY
    || process.env.FLICKR_API_KEY
    || ''
  ).trim()

  if (!photosetId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing query parameter: photosetId' })
  }
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Flickr userId' })
  }
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server Flickr API key is not configured (expected NUXT_FLICKR_API_KEY or FLICKR_API_KEY)'
    })
  }

  const payload = await $fetch<FlickrApiResponse>('https://www.flickr.com/services/rest/', {
    query: {
      method: 'flickr.photosets.getPhotos',
      api_key: apiKey,
      photoset_id: photosetId,
      user_id: userId,
      extras: 'url_q,url_m,url_z,url_l,url_o,o_dims',
      per_page: perPage,
      page,
      format: 'json',
      nojsoncallback: 1
    }
  })

  if (payload.stat !== 'ok') {
    throw createError({
      statusCode: 502,
      statusMessage: payload.message || 'Flickr API request failed'
    })
  }

  const photos = (payload.photoset?.photo ?? []).map((photo, index) => {
    const src = pickFirst(photo.url_l, photo.url_z, photo.url_m, photo.url_o, buildPhotoUrl(photo, 'b'))
    const thumb = pickFirst(photo.url_q, photo.url_m, photo.url_z, src)
    const width = pickFirstPositiveInt(photo.width_l, photo.width_z, photo.width_m, photo.width_o, photo.o_width)
    const height = pickFirstPositiveInt(photo.height_l, photo.height_z, photo.height_m, photo.height_o, photo.o_height)
    const title = (photo.title || '').trim()

    return {
      id: photo.id,
      title,
      alt: title || `Flickr photo ${index + 1}`,
      src,
      thumb,
      width,
      height
    }
  })

  const currentPage = parsePositiveInt(payload.photoset?.page, page, 4000)
  const totalPages = parsePositiveInt(payload.photoset?.pages, 1, 4000)
  const totalItems = parsePositiveInt(payload.photoset?.total, photos.length, 1000000)

  return {
    photosetId,
    title: payload.photoset?.title || '',
    page: currentPage,
    totalPages,
    hasMore: currentPage < totalPages,
    perPage,
    total: totalItems,
    photos
  }
})
