// Site layout data (navigation, global config) of the current site and language.
// It is fetched during SSR and shipped in the payload, so server and client render from the same data.
// The page's own data is not available yet when the layout renders on the server.
//
// TYPO3 delivers it via the site layout endpoint (type=8901) on the site root, which is cached once per language.
// Backends without that endpoint get the complete root page instead (same fields, plus the page content).
export const SITE_LAYOUT_TYPE = 8901

export const useSiteRootData = () => {
  const requestUrl = useRequestURL()
  const route = useRoute()
  // Forwards the incoming request headers on the server, so the proxy resolves the right site.
  const requestFetch = useRequestFetch()
  const localePrefix = computed(() => (/^\/en(\/|$)/.test(route.path.toLowerCase()) ? '/en' : ''))
  // Pass the TYPO3 workspace preview keyword on, so draft pages also show up in the navigation.
  const previewKeyword = computed(() => {
    const value = route.query.ADMCMD_prev
    return typeof value === 'string' ? value : ''
  })

  return useAsyncData<Record<string, unknown>>(
    () => `site-root:${requestUrl.host}${localePrefix.value}${previewKeyword.value ? ':preview' : ''}`,
    async () => {
      const path = `/api/typo3${localePrefix.value}`
      const query: Record<string, string> = previewKeyword.value ? { ADMCMD_prev: previewKeyword.value } : {}

      try {
        const layout = await requestFetch<Record<string, unknown>>(path, {
          query: { ...query, type: String(SITE_LAYOUT_TYPE) }
        })
        if (Array.isArray(layout?.headerNavigation)) {
          return layout
        }
      }
      catch {
        // Backend without the site layout endpoint: fall back to the root page below.
      }

      return requestFetch<Record<string, unknown>>(path, { query })
    }
  )
}
