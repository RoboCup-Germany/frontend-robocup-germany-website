declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const ensureGtag = () => {
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
  }
}

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const gtagId = runtimeConfig.public.gtagId as string
  if (!gtagId) return

  const { cookiesEnabledIds } = useCookieControl()
  let isConfigured = false

  const updateConsent = (granted: boolean) => {
    ensureGtag()
    window.gtag?.('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied'
    })
  }

  watch(
    cookiesEnabledIds,
    (enabledIds) => {
      const hasAnalyticsConsent = (enabledIds ?? []).includes('google-analytics')
      updateConsent(hasAnalyticsConsent)

      if (!hasAnalyticsConsent || isConfigured) return

      ensureGtag()
      window.gtag?.('js', new Date())
      window.gtag?.('config', gtagId, {
        anonymize_ip: true
      })
      isConfigured = true
    },
    { immediate: true, deep: true }
  )
})
