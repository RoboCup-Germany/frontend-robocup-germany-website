import { getRequestHeaders, getRequestURL, type H3Event } from 'h3'
import { resolveSiteFromPublicConfig, type PublicSiteRuntimeConfig } from '~/utils/site-config'

export const getFrontendRequestHost = (event: H3Event): string => {
  const headers = getRequestHeaders(event)

  return String(
    headers['x-forwarded-host']
    || headers['x-original-host']
    || headers.host
    || ''
  )
}

export const resolveRequestSite = (event: H3Event, publicConfig: PublicSiteRuntimeConfig | undefined) => {
  return resolveSiteFromPublicConfig(getFrontendRequestHost(event), getFrontendRequestPath(event), publicConfig)
}

export const getFrontendRequestPath = (event: H3Event): string => {
  const pathname = getRequestURL(event).pathname
  if (pathname === '/api/typo3') return '/'
  if (pathname.startsWith('/api/typo3/')) {
    return `/${pathname.slice('/api/typo3/'.length)}`
  }

  return pathname || '/'
}

export const stripSitePathPrefix = (path: string, pathPrefix?: string): string => {
  if (!pathPrefix) return path
  if (path === pathPrefix) return ''
  if (path.startsWith(`${pathPrefix}/`)) {
    return path.slice(pathPrefix.length).replace(/^\/+/, '')
  }

  return path
}

export const createTypo3ContextHeaders = (event: H3Event, typo3Host?: string) => {
  const headers = { ...getRequestHeaders(event) }
  const frontendHost = getFrontendRequestHost(event)
  const upstreamHost = typo3Host || frontendHost

  delete headers['content-length']

  if (upstreamHost) {
    headers.host = upstreamHost
  }

  if (frontendHost) {
    headers['x-forwarded-host'] = frontendHost
  }

  headers['x-forwarded-proto'] = headers['x-forwarded-proto'] || 'https'

  return headers
}
