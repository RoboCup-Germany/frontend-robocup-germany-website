const normalizeProxyBase = (value: unknown): string => {
    const fallback = '/api/typo3'
    const raw = String(value ?? '').trim()
    if (!raw) return fallback

    if (raw.startsWith('/')) {
        return raw.replace(/\/+$/, '') || fallback
    }

    try {
        const parsed = new URL(raw)
        const path = parsed.pathname.replace(/\/+$/, '')
        return path || fallback
    } catch {
        return fallback
    }
}

export default defineNuxtPlugin({
    name: 'typo3-baseurl-guard',
    enforce: 'pre',
    setup() {
        const runtimeConfig = useRuntimeConfig()
        const apiConfig = (runtimeConfig.public as { typo3?: { api?: { baseUrl?: string } } })?.typo3?.api
        if (!apiConfig) return

        const normalized = normalizeProxyBase(apiConfig.baseUrl)

        if (normalized.startsWith('/')) {
            const requestUrl = useRequestURL()
            const origin = requestUrl?.origin || ''
            apiConfig.baseUrl = origin ? `${origin}${normalized}` : normalized
            return
        }

        apiConfig.baseUrl = normalized
    }
})