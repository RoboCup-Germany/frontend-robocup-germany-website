import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const origin = trimTrailingSlash(config.typo3ApiOrigin as string)
  const path = event.context.params?.path ?? ''
  const requestUrl = getRequestURL(event)
  const query = requestUrl.search || ''

  const normalizedPath = Array.isArray(path) ? path.join('/') : path
  const target = `${origin}/${normalizedPath}${query}`

  return proxyRequest(event, target)
})
