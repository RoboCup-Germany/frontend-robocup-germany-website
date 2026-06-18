export const useCmsLink = () => {
  const runtimeConfig = useRuntimeConfig()
  const activeSite = useState<{
    domains?: string[]
    typo3ApiOrigin?: string
  } | null>('active-site', () => null)

  const knownInternalHosts = new Set<string>()
  const configuredInternalHosts = runtimeConfig.public?.typo3?.api?.internalHosts

  const apiBaseUrl = runtimeConfig.public?.typo3?.api?.baseUrl
  if (typeof apiBaseUrl === 'string' && apiBaseUrl.length > 0) {
    try {
      knownInternalHosts.add(new URL(apiBaseUrl).host)
    }
    catch {
      // Ignore invalid URL config.
    }
  }

  const backendBaseUrl = runtimeConfig.public?.typo3?.api?.backendBaseUrl
  if (typeof backendBaseUrl === 'string' && backendBaseUrl.length > 0) {
    try {
      knownInternalHosts.add(new URL(backendBaseUrl).host)
    }
    catch {
      // Ignore invalid URL config.
    }
  }

  if (Array.isArray(configuredInternalHosts)) {
    configuredInternalHosts.forEach((host) => {
      if (typeof host === 'string' && host.trim()) {
        knownInternalHosts.add(host.trim().toLowerCase())
      }
    })
  } else if (typeof configuredInternalHosts === 'string' && configuredInternalHosts.trim()) {
    configuredInternalHosts
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
      .forEach((host) => knownInternalHosts.add(host))
  }

  if (import.meta.client) {
    knownInternalHosts.add(window.location.host.toLowerCase())
    knownInternalHosts.add(window.location.hostname.toLowerCase())
  }

  activeSite.value?.domains?.forEach((domain) => {
    if (typeof domain === 'string' && domain.trim()) {
      knownInternalHosts.add(domain.trim().toLowerCase())
    }
  })

  const stripBackendPathPrefix = (parsed: URL): string => {
    const href = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
    const typo3ApiOrigin = activeSite.value?.typo3ApiOrigin
    if (!typo3ApiOrigin) {
      return href
    }

    try {
      const originUrl = new URL(typo3ApiOrigin)
      const originPath = originUrl.pathname.replace(/\/+$/, '')
      if (!originPath || originPath === '/') {
        return href
      }

      if (parsed.pathname === originPath) {
        return `/${parsed.search}${parsed.hash}`
      }

      if (parsed.pathname.startsWith(`${originPath}/`)) {
        const frontendPath = parsed.pathname.slice(originPath.length) || '/'
        return `${frontendPath}${parsed.search}${parsed.hash}`
      }
    }
    catch {
      // Ignore invalid runtime config.
    }

    return href
  }

  const normalize = (href?: string | null): string | undefined => {
    if (!href) {
      return undefined
    }

    const value = href.trim()
    if (!value) {
      return undefined
    }

    if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) {
      return value
    }

    if (/^(mailto:|tel:|sms:)/i.test(value)) {
      return value
    }

    try {
      const parsed = new URL(value.startsWith('//') ? `https:${value}` : value)
      const parsedHost = parsed.host.toLowerCase()
      const parsedHostname = parsed.hostname.toLowerCase()

      if (knownInternalHosts.has(parsedHost) || knownInternalHosts.has(parsedHostname)) {
        return stripBackendPathPrefix(parsed)
      }

      return value
    }
    catch {
      return value
    }
  }

  const isExternal = (href?: string | null): boolean => {
    const value = normalize(href)

    if (!value) {
      return false
    }

    if (
      value.startsWith('/') ||
      value.startsWith('#') ||
      value.startsWith('?') ||
      value.startsWith('./') ||
      value.startsWith('../')
    ) {
      return false
    }

    return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value)
  }

  return {
    normalize,
    isExternal,
  }
}
