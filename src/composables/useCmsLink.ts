export const useCmsLink = () => {
  const runtimeConfig = useRuntimeConfig()

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

  if (process.client) {
    knownInternalHosts.add(window.location.host.toLowerCase())
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

      if (knownInternalHosts.has(parsedHost)) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
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
