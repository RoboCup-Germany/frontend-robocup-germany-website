import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const origin = trimTrailingSlash(config.typo3ApiOrigin as string)
  const requestUrl = getRequestURL(event)
  const query = requestUrl.search || ''
  const target = `${origin}/${query}`

  return proxyRequest(event, target)
})
