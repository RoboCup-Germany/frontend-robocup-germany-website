import { defineEventHandler, getMethod, getRequestHeaders, getRequestURL, proxyRequest } from 'h3'
import { fetchWithWatchedCache } from '~/server/utils/upstream-cache'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const cacheControl = 'public, max-age=0, s-maxage=0, must-revalidate'

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
  const requestUrl = getRequestURL(event)
  const query = requestUrl.search || ''
  const target = `${origin}/${query}`

  if (getMethod(event) !== 'GET') {
    const requestHeaders = { ...getRequestHeaders(event) }
    delete requestHeaders.host
    delete requestHeaders['content-length']
    return proxyRequest(event, target, { headers: requestHeaders })
  }

  return fetchWithWatchedCache(event, target, {
    cacheNamespace: 'typo3-root',
    cacheControlHeader: cacheControl,
    minFreshMs: upstreamCache.minFreshMs,
    hardTtlMs: upstreamCache.hardTtlMs,
    staleIfErrorMs: upstreamCache.staleIfErrorMs,
    maxEntries: upstreamCache.maxEntries,
    maxTotalBytes: upstreamCache.maxTotalBytes,
    maxBodyBytes: upstreamCache.maxBodyBytes
  })
})
