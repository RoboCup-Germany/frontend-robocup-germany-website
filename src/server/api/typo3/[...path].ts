import { defineEventHandler, getMethod, getRequestHeaders, getRequestURL, proxyRequest } from 'h3'
import { fetchWithWatchedCache } from '~/server/utils/upstream-cache'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const cacheControl = 'public, max-age=5, s-maxage=30, stale-while-revalidate=120, stale-if-error=600'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const upstreamCache = config.upstreamCache as {
    minFreshMs?: number
    hardTtlMs?: number
    staleIfErrorMs?: number
    maxEntries?: number
    maxTotalBytes?: number
    maxBodyBytes?: number
  }
  const origin = trimTrailingSlash(config.typo3ApiOrigin as string)
  const path = event.context.params?.path ?? ''
  const requestUrl = getRequestURL(event)
  const query = requestUrl.search || ''

  const normalizedPath = Array.isArray(path) ? path.join('/') : path
  const locales = Array.isArray(config.public?.typo3?.i18n?.locales)
    ? config.public.typo3.i18n.locales
    : []
  const isLocaleRoot = locales.includes(normalizedPath)
  const targetPath = isLocaleRoot ? `${normalizedPath}/` : normalizedPath
  const target = `${origin}/${targetPath}${query}`

  if (getMethod(event) !== 'GET') {
    const requestHeaders = { ...getRequestHeaders(event) }
    delete requestHeaders.host
    delete requestHeaders['content-length']
    return proxyRequest(event, target, { headers: requestHeaders })
  }

  return fetchWithWatchedCache(event, target, {
    cacheNamespace: 'typo3',
    cacheControlHeader: cacheControl,
    minFreshMs: upstreamCache.minFreshMs,
    hardTtlMs: upstreamCache.hardTtlMs,
    staleIfErrorMs: upstreamCache.staleIfErrorMs,
    maxEntries: upstreamCache.maxEntries,
    maxTotalBytes: upstreamCache.maxTotalBytes,
    maxBodyBytes: upstreamCache.maxBodyBytes
  })
})
