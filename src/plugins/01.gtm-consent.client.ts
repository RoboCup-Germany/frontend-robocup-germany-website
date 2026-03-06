declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>
  }
}

const ensureGoogleTagManager = (gtmId: string) => {
  const src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (existing) return

  // Google Tag Manager snippet (consent-gated)
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
  let isLoaded = false

  watch(
    cookiesEnabledIds,
    (enabledIds) => {
      const hasTagManagerConsent = (enabledIds ?? []).includes('google-tag-manager')
      if (!hasTagManagerConsent || isLoaded) return

      ensureGoogleTagManager(gtmId)
      isLoaded = true
    },
    { immediate: true, deep: true }
  )
})
