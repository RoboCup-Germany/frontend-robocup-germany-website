import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

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

  return proxyRequest(event, target)
})
