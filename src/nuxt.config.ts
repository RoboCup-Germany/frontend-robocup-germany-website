import { createResolver } from 'nuxt/kit'

const { resolve } = createResolver(import.meta.url)
const typo3ProxyBaseUrl = process.env.NUXT_PUBLIC_TYPO3_PROXY_BASE_URL ?? 'http://localhost:3000/api/typo3'
const typo3BackendOrigin = process.env.NUXT_TYPO3_API_ORIGIN ?? process.env.NUXT_PUBLIC_TYPO3_API_BASE_URL ?? 'http://rc-new-website.ddev.site'
const flickrApiKey = process.env.NUXT_FLICKR_API_KEY ?? ''
const flickrUserId = process.env.NUXT_FLICKR_USER_ID ?? '200186101@N05'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-11-14',
    devtools: { enabled: true },

    modules: [
        '@nuxt/eslint',
        '@nuxt/image',
        '@nuxt/scripts',
        '@nuxt/ui',
        '@nuxt/test-utils',
        '@t3headless/nuxt-typo3'
    ],
    typo3: {
        api: {
            baseUrl: typo3ProxyBaseUrl
        },
        i18n: {
            default: 'de',
            locales: ['de', 'en']
        },
    },
    css: [
        resolve("assets/styles/app/tailwind.css")
    ],
    runtimeConfig: {
        typo3ApiOrigin: typo3BackendOrigin,
        flickrApiKey,
        flickrUserId,
        public: {
            typo3: {
                api: {
                    baseUrl: typo3ProxyBaseUrl,
                    backendBaseUrl: typo3BackendOrigin,
                    proxyHeaders: false,
                    proxyReqHeaders: false,
                },
                i18n: {
                    default: 'de',
                    locales: ['de', 'en']
                },
                features: {
                    i18nMiddleware: true,
                }
            },
        }
    }
})
