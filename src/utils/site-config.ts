export interface PublicSiteConfig {
  key?: string
  theme: string
  domains: string[]
  isDefault?: boolean
  pathPrefix?: string
  typo3ApiOrigin?: string
  typo3Host?: string
}

export interface NormalizedSiteConfig extends PublicSiteConfig {
  key: string
  theme: string
  domains: string[]
}

export interface ResolvedSiteConfig extends NormalizedSiteConfig {
  host: string
  path: string
  isKnown: boolean
}

export interface PublicSiteRuntimeConfig {
  siteConfig?: string | PublicSiteConfig[]
}

export const DEFAULT_SITE_KEY = 'default'
export const DEFAULT_THEME = 'default'

export const normalizeHost = (value: string | undefined | null): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const firstForwardedHost = raw.split(',')[0]?.trim() ?? ''
  const withoutProtocol = firstForwardedHost.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  const withoutPath = withoutProtocol.split('/')[0] ?? ''
  const withoutPort = withoutPath.replace(/:\d+$/, '')

  return withoutPort.toLowerCase()
}

const normalizeSite = (site: PublicSiteConfig, index: number): NormalizedSiteConfig => {
  const theme = String(site.theme || DEFAULT_THEME).trim() || DEFAULT_THEME
  const domains = Array.isArray(site.domains)
    ? site.domains.map((domain) => normalizeHost(domain)).filter(Boolean)
    : []
  const pathPrefix = normalizePathPrefix(site.pathPrefix)

  return {
    ...site,
    key: String(site.key || theme || `site-${index}`).trim() || `site-${index}`,
    theme,
    domains,
    pathPrefix,
    typo3ApiOrigin: normalizeUrl(site.typo3ApiOrigin) || undefined,
    typo3Host: normalizeHost(site.typo3Host) || undefined
  }
}

export const normalizePathPrefix = (value: string | undefined | null): string => {
  const raw = String(value ?? '').trim()
  if (!raw || raw === '/') return ''

  return `/${raw.replace(/^\/+|\/+$/g, '')}`
}

const normalizePath = (value: string | undefined | null): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return '/'

  return raw.startsWith('/') ? raw : `/${raw}`
}

const normalizeUrl = (value: string | undefined | null): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  try {
    const parsed = new URL(raw)
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/'
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export const parseSiteConfig = (value: string | PublicSiteConfig[] | undefined): NormalizedSiteConfig[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeSite)
  }

  const raw = String(value ?? '').trim()
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((site): site is PublicSiteConfig => Boolean(site && typeof site === 'object'))
        .map(normalizeSite)
      : []
  } catch {
    return []
  }
}

const getFallbackDefaultSite = (): NormalizedSiteConfig => ({
  key: DEFAULT_SITE_KEY,
  theme: DEFAULT_THEME,
  domains: [],
  isDefault: true
})

export const resolveSiteFromHost = (
  host: string | undefined | null,
  path: string | undefined | null,
  sites: NormalizedSiteConfig[] | undefined
): ResolvedSiteConfig => {
  const normalizedHost = normalizeHost(host)
  const normalizedPath = normalizePath(path)
  const availableSites = Array.isArray(sites) ? sites : []
  const defaultSite = availableSites.find((site) => site.isDefault) ?? getFallbackDefaultSite()

  const matchedSite = availableSites.find((site) => (
    site.domains.some((domain) => domain === normalizedHost)
    && (!site.pathPrefix || normalizedPath === site.pathPrefix || normalizedPath.startsWith(`${site.pathPrefix}/`))
  ))

  const resolvedSite = matchedSite ?? defaultSite

  return {
    ...resolvedSite,
    host: normalizedHost,
    path: normalizedPath,
    isKnown: Boolean(matchedSite)
  }
}

export const resolveSiteFromPublicConfig = (
  host: string | undefined | null,
  path: string | undefined | null,
  publicConfig: PublicSiteRuntimeConfig | undefined
): ResolvedSiteConfig => {
  return resolveSiteFromHost(host, path, parseSiteConfig(publicConfig?.siteConfig))
}

export const resolveThemeFromTypo3SitePayload = (value: unknown, fallback = DEFAULT_THEME): string => {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const source = value as {
    site?: {
      identifier?: unknown
      theme?: {
        name?: unknown
      }
    }
  }

  const themeName = typeof source.site?.theme?.name === 'string'
    ? source.site.theme.name.trim()
    : ''
  const siteIdentifier = typeof source.site?.identifier === 'string'
    ? source.site.identifier.trim()
    : ''

  return themeName || siteIdentifier || fallback
}
