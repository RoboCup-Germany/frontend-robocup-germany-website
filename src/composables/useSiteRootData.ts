// Root page data (navigation, global config) of the current site and language.
// It is fetched during SSR and shipped in the payload, so server and client render from the same data.
// The page's own data is not available yet when the layout renders on the server.
export const useSiteRootData = () => {
  const requestUrl = useRequestURL()
  const route = useRoute()
  const localePrefix = computed(() => (/^\/en(\/|$)/.test(route.path.toLowerCase()) ? '/en' : ''))

  return useFetch<Record<string, unknown>>(() => `/api/typo3${localePrefix.value}`, {
    key: () => `site-root:${requestUrl.host}${localePrefix.value}`
  })
}
