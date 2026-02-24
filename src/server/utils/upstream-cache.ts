import { createHash } from 'node:crypto'
import { createError, getRequestHeaders, setResponseHeader, setResponseStatus, type H3Event } from 'h3'

type CachedUpstreamEntry = {
  body: string
  contentType: string
  etag?: string
  lastModified?: string
  updatedAt: number
}

type CachedFetchOptions = {
  cacheNamespace: string
  cacheControlHeader: string
  minFreshMs?: number
  hardTtlMs?: number
  staleIfErrorMs?: number
  maxEntries?: number
  maxTotalBytes?: number
  maxBodyBytes?: number
}

type CacheIndexEntry = {
  updatedAt: number
  size: number
  expiresAt: number
}

type CacheIndex = {
  entries: Record<string, CacheIndexEntry>
}

const HOP_BY_HOP_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length'
])

const TRACKING_QUERY_PREFIXES = ['utm_']
const TRACKING_QUERY_KEYS = new Set(['gclid', 'fbclid', 'msclkid'])

const DEFAULT_MIN_FRESH_MS = 15_000
const DEFAULT_HARD_TTL_MS = 6 * 60 * 60 * 1000
const DEFAULT_STALE_IF_ERROR_MS = 24 * 60 * 60 * 1000
const DEFAULT_MAX_ENTRIES = 400
const DEFAULT_MAX_TOTAL_BYTES = 50 * 1024 * 1024
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024

const toStorageKey = (namespace: string, normalizedUrl: string) => {
  const hash = createHash('sha256').update(normalizedUrl).digest('hex')
  return `upstream:${namespace}:${hash}`
}

const toIndexKey = (namespace: string) => `upstream-index:${namespace}`

const normalizeUrlForCache = (input: string) => {
  const parsed = new URL(input)
  const params = Array.from(parsed.searchParams.entries())
    .filter(([key]) => {
      const lower = key.toLowerCase()
      if (TRACKING_QUERY_KEYS.has(lower)) return false
      return !TRACKING_QUERY_PREFIXES.some((prefix) => lower.startsWith(prefix))
    })
    .sort(([aKey, aVal], [bKey, bVal]) => {
      if (aKey === bKey) return aVal.localeCompare(bVal)
      return aKey.localeCompare(bKey)
    })

  parsed.search = ''
  for (const [key, value] of params) {
    parsed.searchParams.append(key, value)
  }

  return parsed.toString()
}

const calcBodyBytes = (value: string) => Buffer.byteLength(value, 'utf8')

const totalIndexBytes = (index: CacheIndex) => {
  return Object.values(index.entries).reduce((acc, entry) => acc + (entry.size || 0), 0)
}

const oldestFirstEntryKeys = (index: CacheIndex) => {
  return Object.entries(index.entries)
    .sort(([, a], [, b]) => a.updatedAt - b.updatedAt)
    .map(([entryKey]) => entryKey)
}

const loadIndex = async (storage: ReturnType<typeof useStorage>, indexKey: string): Promise<CacheIndex> => {
  const existing = await storage.getItem<CacheIndex>(indexKey)
  if (!existing || !existing.entries || typeof existing.entries !== 'object') {
    return { entries: {} }
  }
  return existing
}

const persistIndex = async (storage: ReturnType<typeof useStorage>, indexKey: string, index: CacheIndex) => {
  await storage.setItem(indexKey, index)
}

const removeEntry = async (
  storage: ReturnType<typeof useStorage>,
  index: CacheIndex,
  cacheKey: string
) => {
  delete index.entries[cacheKey]
  await storage.removeItem(cacheKey)
}

const pruneExpired = async (
  storage: ReturnType<typeof useStorage>,
  index: CacheIndex,
  now: number
) => {
  for (const [cacheKey, meta] of Object.entries(index.entries)) {
    if (meta.expiresAt > now) continue
    await removeEntry(storage, index, cacheKey)
  }
}

const enforceLimits = async (
  storage: ReturnType<typeof useStorage>,
  index: CacheIndex,
  maxEntries: number,
  maxTotalBytes: number
) => {
  while (Object.keys(index.entries).length > maxEntries || totalIndexBytes(index) > maxTotalBytes) {
    const oldest = oldestFirstEntryKeys(index)[0]
    if (!oldest) break
    await removeEntry(storage, index, oldest)
  }
}

const setIndexEntry = (
  index: CacheIndex,
  cacheKey: string,
  updatedAt: number,
  size: number,
  expiresAt: number
) => {
  index.entries[cacheKey] = { updatedAt, size, expiresAt }
}

const sanitizeRequestHeaders = (headers: Record<string, string | string[] | undefined>) => {
  const out: Record<string, string> = {}
  for (const [rawKey, value] of Object.entries(headers)) {
    const key = rawKey.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(key)) continue
    if (typeof value === 'string') {
      out[key] = value
      continue
    }
    if (Array.isArray(value)) {
      out[key] = value.join(', ')
    }
  }
  return out
}

const parseResponseBody = (body: string, contentType: string) => {
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(body)
    } catch {
      return body
    }
  }
  return body
}

const ensureNumber = (value: unknown, fallback: number) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback
  return Math.floor(numeric)
}

const setCacheHeaders = (
  event: H3Event,
  cacheControlHeader: string,
  contentType: string,
  cacheStatus: string
) => {
  setResponseHeader(event, 'cache-control', cacheControlHeader)
  setResponseHeader(event, 'x-upstream-cache', cacheStatus)
  setResponseHeader(event, 'content-type', contentType)
}

const shouldUseStaleOnError = (
  cached: CachedUpstreamEntry | null,
  staleIfErrorMs: number,
  hardTtlMs: number
) => {
  if (!cached) return false
  const age = Date.now() - cached.updatedAt
  return age <= staleIfErrorMs && age <= hardTtlMs
}

export const fetchWithWatchedCache = async (
  event: H3Event,
  targetUrl: string,
  options: CachedFetchOptions
) => {
  const storage = useStorage('cache')
  const now = Date.now()

  const minFreshMs = ensureNumber(options.minFreshMs, DEFAULT_MIN_FRESH_MS)
  const hardTtlMs = ensureNumber(options.hardTtlMs, DEFAULT_HARD_TTL_MS)
  const staleIfErrorMs = ensureNumber(options.staleIfErrorMs, DEFAULT_STALE_IF_ERROR_MS)
  const maxEntries = ensureNumber(options.maxEntries, DEFAULT_MAX_ENTRIES)
  const maxTotalBytes = ensureNumber(options.maxTotalBytes, DEFAULT_MAX_TOTAL_BYTES)
  const maxBodyBytes = ensureNumber(options.maxBodyBytes, DEFAULT_MAX_BODY_BYTES)

  const normalizedUrl = normalizeUrlForCache(targetUrl)
  const key = toStorageKey(options.cacheNamespace, normalizedUrl)
  const indexKey = toIndexKey(options.cacheNamespace)

  const index = await loadIndex(storage, indexKey)
  await pruneExpired(storage, index, now)

  let cached = await storage.getItem<CachedUpstreamEntry>(key)

  if (cached && now - cached.updatedAt > hardTtlMs) {
    await removeEntry(storage, index, key)
    cached = null
  }

  const isFresh = Boolean(cached && now - cached.updatedAt < minFreshMs)
  if (cached && isFresh) {
    setCacheHeaders(event, options.cacheControlHeader, cached.contentType, 'hit:fresh')
    await persistIndex(storage, indexKey, index)
    return parseResponseBody(cached.body, cached.contentType)
  }

  const requestHeaders = sanitizeRequestHeaders(getRequestHeaders(event))
  if (cached?.etag) {
    requestHeaders['if-none-match'] = cached.etag
  }
  if (cached?.lastModified) {
    requestHeaders['if-modified-since'] = cached.lastModified
  }

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method: 'GET',
      headers: requestHeaders
    })
  } catch (error) {
    if (shouldUseStaleOnError(cached, staleIfErrorMs, hardTtlMs)) {
      setCacheHeaders(event, options.cacheControlHeader, cached!.contentType, 'hit:stale-if-error')
      await persistIndex(storage, indexKey, index)
      return parseResponseBody(cached!.body, cached!.contentType)
    }
    throw error
  }

  if (response.status === 304 && cached) {
    const updatedAt = Date.now()
    await storage.setItem(key, {
      ...cached,
      etag: response.headers.get('etag') || cached.etag,
      lastModified: response.headers.get('last-modified') || cached.lastModified,
      updatedAt
    })
    setIndexEntry(index, key, updatedAt, calcBodyBytes(cached.body), updatedAt + hardTtlMs)
    await enforceLimits(storage, index, maxEntries, maxTotalBytes)
    await persistIndex(storage, indexKey, index)

    setCacheHeaders(event, options.cacheControlHeader, cached.contentType, 'hit:revalidated')
    return parseResponseBody(cached.body, cached.contentType)
  }

  const body = await response.text()

  if (!response.ok) {
    if (shouldUseStaleOnError(cached, staleIfErrorMs, hardTtlMs)) {
      setCacheHeaders(event, options.cacheControlHeader, cached!.contentType, 'hit:stale-if-error')
      await persistIndex(storage, indexKey, index)
      return parseResponseBody(cached!.body, cached!.contentType)
    }
    throw createError({
      statusCode: response.status,
      statusMessage: `Upstream request failed (${response.status})`,
      data: body
    })
  }

  const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8'
  const bodyBytes = calcBodyBytes(body)

  if (bodyBytes <= maxBodyBytes) {
    const updatedAt = Date.now()
    await storage.setItem(key, {
      body,
      contentType,
      etag: response.headers.get('etag') || undefined,
      lastModified: response.headers.get('last-modified') || undefined,
      updatedAt
    } satisfies CachedUpstreamEntry)

    setIndexEntry(index, key, updatedAt, bodyBytes, updatedAt + hardTtlMs)
    await enforceLimits(storage, index, maxEntries, maxTotalBytes)
    await persistIndex(storage, indexKey, index)

    setCacheHeaders(event, options.cacheControlHeader, contentType, cached ? 'miss:changed' : 'miss:cold')
  } else {
    await persistIndex(storage, indexKey, index)
    setCacheHeaders(event, options.cacheControlHeader, contentType, 'skip:body-too-large')
  }

  setResponseStatus(event, response.status)
  return parseResponseBody(body, contentType)
}
