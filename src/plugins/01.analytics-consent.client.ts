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

const ensureGtagScript = (gtagId: string) => {
  const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagId)}`
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (existing) return

  const script = document.createElement('script')
  script.async = true
  script.src = src
  script.setAttribute('data-cookie-control', 'google-analytics')
  document.head.appendChild(script)
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

      ensureGtagScript(gtagId)
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
