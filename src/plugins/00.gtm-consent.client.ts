declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const CONSENT_DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
} as const

const CONSENT_GRANTED = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted'
} as const

const ensureGtag = () => {
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args)
    }
  }
}

const setConsentDefaults = () => {
  ensureGtag()
  window.gtag?.('consent', 'default', {
    ...CONSENT_DENIED,
    wait_for_update: 500
  })
  window.gtag?.('set', 'ads_data_redaction', true)
}

const ensureGoogleTagManager = (gtmId: string) => {
  const src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (existing) return

  // Google Tag Manager snippet
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  })

  const firstScript = document.getElementsByTagName('script')[0]
  const gtmScript = document.createElement('script')
  gtmScript.async = true
  gtmScript.src = src
  gtmScript.setAttribute('data-cookie-control', 'google-tag-manager')
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(gtmScript, firstScript)
  } else {
    document.head.appendChild(gtmScript)
  }
}

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const gtmId = runtimeConfig.public.gtmId as string
  if (!gtmId) return

  const { cookiesEnabledIds } = useCookieControl()
  setConsentDefaults()

  watch(
    cookiesEnabledIds,
    (enabledIds) => {
      const hasTagManagerConsent = (enabledIds ?? []).includes('google-tag-manager')
      ensureGtag()
      window.gtag?.('consent', 'update', hasTagManagerConsent ? CONSENT_GRANTED : CONSENT_DENIED)
      if (hasTagManagerConsent) {
        ensureGoogleTagManager(gtmId)
      }
    },
    { immediate: true, deep: true }
  )
})
