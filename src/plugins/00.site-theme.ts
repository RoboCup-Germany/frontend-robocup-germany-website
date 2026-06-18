import { resolveSiteFromPublicConfig, type PublicSiteRuntimeConfig } from '~/utils/site-config'

export default defineNuxtPlugin({
  name: 'site-theme',
  enforce: 'pre',
  setup() {
    const runtimeConfig = useRuntimeConfig()
    const requestUrl = useRequestURL()
    const publicConfig = runtimeConfig.public as PublicSiteRuntimeConfig | undefined
    const site = resolveSiteFromPublicConfig(requestUrl.host, requestUrl.pathname, publicConfig)

    useState('active-site', () => site)
    useHead({
      htmlAttrs: {
        'data-site': site.key,
        'data-theme': site.theme
      }
    })
  }
})
