import { defineEventHandler, getRequestHeaders, getRequestURL, proxyRequest, setResponseHeader } from 'h3'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const cacheControl = 'public, max-age=5, s-maxage=30, stale-while-revalidate=120, stale-if-error=600'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const origin = trimTrailingSlash(config.typo3ApiOrigin as string)
  const requestUrl = getRequestURL(event)
  const query = requestUrl.search || ''
  const target = `${origin}/${query}`

  setResponseHeader(event, 'cache-control', cacheControl)

  const requestHeaders = { ...getRequestHeaders(event) }
  delete requestHeaders.host
  delete requestHeaders['content-length']

  return proxyRequest(event, target, {
    headers: requestHeaders
  })
})
