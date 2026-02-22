import { defineEventHandler, getRequestHeaders, getRequestURL, proxyRequest, setResponseHeader } from 'h3'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const cacheControl = 'public, max-age=5, s-maxage=30, stale-while-revalidate=120, stale-if-error=600'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
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

  setResponseHeader(event, 'cache-control', cacheControl)

  const requestHeaders = { ...getRequestHeaders(event) }
  delete requestHeaders.host
  delete requestHeaders['content-length']

  return proxyRequest(event, target, {
    headers: requestHeaders
  })
})
