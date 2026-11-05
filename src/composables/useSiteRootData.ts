// Root page data (navigation, global config) of the current site and language.
// It is fetched during SSR and shipped in the payload, so server and client render from the same data.
// The page's own data is not available yet when the layout renders on the server.
export const useSiteRootData = () => {
  const requestUrl = useRequestURL()
  const route = useRoute()
  const localePrefix = computed(() => (/^\/en(\/|$)/.test(route.path.toLowerCase()) ? '/en' : ''))
  // Pass the TYPO3 workspace preview keyword on, so draft pages also show up in the navigation.
  const previewKeyword = computed(() => {
    const value = route.query.ADMCMD_prev
    return typeof value === 'string' ? value : ''
  })

  return useFetch<Record<string, unknown>>(() => `/api/typo3${localePrefix.value}`, {
    query: computed(() => (previewKeyword.value ? { ADMCMD_prev: previewKeyword.value } : {})),
    key: () => `site-root:${requestUrl.host}${localePrefix.value}${previewKeyword.value ? ':preview' : ''}`
  })
}
