import { defineEventHandler, getMethod, getRequestURL, proxyRequest } from 'h3'
import { createTypo3ContextHeaders, resolveRequestSite } from '~/server/utils/site-context'
import { fetchWithWatchedCache } from '~/server/utils/upstream-cache'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')
const cacheControl = 'public, max-age=0, s-maxage=0, must-revalidate'
const frontendOnlyParams = new Set(['download', 'print'])

const joinUrl = (origin: string, path = '', query = '') => {
  const normalizedOrigin = trimTrailingSlash(origin)
  const normalizedPath = trimSlashes(path)
  return `${normalizedOrigin}${normalizedPath ? `/${normalizedPath}` : '/'}${query}`
}

const sanitizeSearch = (search: string) => {
  const params = new URLSearchParams(search)

  frontendOnlyParams.forEach((param) => {
    params.delete(param)
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

const toErrorMeta = (error: unknown) => {
  const source = error as {
    statusCode?: number
    statusMessage?: string
    data?: unknown
  } | null

  const rawData = typeof source?.data === 'string'
    ? source.data
    : source?.data != null
      ? JSON.stringify(source.data)
      : ''

  return {
    statusCode: source?.statusCode,
    statusMessage: source?.statusMessage,
    dataPreview: rawData.slice(0, 500)
  }
}

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
  const site = resolveRequestSite(event, config.public)
  const origin = site.typo3ApiOrigin || config.typo3ApiOrigin as string
  const requestUrl = getRequestURL(event)
  const query = sanitizeSearch(requestUrl.search || '')
  const target = joinUrl(origin, '', query)

  const requestHeaders = createTypo3ContextHeaders(event, site.typo3Host)

  if (getMethod(event) !== 'GET') {
    return proxyRequest(event, target, { headers: requestHeaders })
  }

  try {
    return await fetchWithWatchedCache(event, target, {
      cacheNamespace: `typo3-root:${site.key}`,
      cacheControlHeader: cacheControl,
      requestHeaders,
      minFreshMs: upstreamCache.minFreshMs,
      hardTtlMs: upstreamCache.hardTtlMs,
      staleIfErrorMs: upstreamCache.staleIfErrorMs,
      maxEntries: upstreamCache.maxEntries,
      maxTotalBytes: upstreamCache.maxTotalBytes,
      maxBodyBytes: upstreamCache.maxBodyBytes
    })
  } catch (error) {
    console.error('[api/typo3] cache fetch failed, falling back to proxyRequest', {
      target,
      ...toErrorMeta(error)
    })
    return proxyRequest(event, target, { headers: requestHeaders })
  }
})
