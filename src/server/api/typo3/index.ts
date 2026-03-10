import { defineEventHandler, getMethod, getRequestHeaders, getRequestURL, proxyRequest } from 'h3'
import { fetchWithWatchedCache } from '~/server/utils/upstream-cache'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const cacheControl = 'public, max-age=0, s-maxage=0, must-revalidate'
const frontendOnlyParams = new Set(['download', 'print'])

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
  const origin = trimTrailingSlash(config.typo3ApiOrigin as string)
  const requestUrl = getRequestURL(event)
  const query = sanitizeSearch(requestUrl.search || '')
  const target = `${origin}/${query}`

  const requestHeaders = { ...getRequestHeaders(event) }
  delete requestHeaders.host
  delete requestHeaders['content-length']

  if (getMethod(event) !== 'GET') {
    return proxyRequest(event, target, { headers: requestHeaders })
  }

  try {
    return await fetchWithWatchedCache(event, target, {
      cacheNamespace: 'typo3-root',
      cacheControlHeader: cacheControl,
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
