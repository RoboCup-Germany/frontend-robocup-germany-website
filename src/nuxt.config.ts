import { createResolver } from 'nuxt/kit'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'

const { resolve } = createResolver(import.meta.url)
const typo3ProxyBaseUrl = process.env.NUXT_PUBLIC_TYPO3_PROXY_BASE_URL ?? 'http://localhost:3000/api/typo3'
const typo3BackendOrigin = process.env.NUXT_TYPO3_API_ORIGIN ?? process.env.NUXT_PUBLIC_TYPO3_API_BASE_URL ?? 'http://rc-new-website.ddev.site'
const flickrApiKey = process.env.NUXT_FLICKR_API_KEY ?? ''
const flickrUserId = process.env.NUXT_FLICKR_USER_ID ?? '200186101@N05'
const toInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-11-14',
    devtools: { enabled: false },
    buildDir: '.nuxt',
    experimental: {
        appManifest: false
    },
    routeRules: {
        '/**': {
            ssr: true,
            swr: 120
        },
        '/api/typo3': {
            swr: false,
            headers: {
                'cache-control': 'public, max-age=5, s-maxage=30, stale-while-revalidate=120, stale-if-error=600'
            }
        },
        '/api/typo3/**': {
            swr: false,
            headers: {
                'cache-control': 'public, max-age=5, s-maxage=30, stale-while-revalidate=120, stale-if-error=600'
            }
        },
        '/api/flickr-photoset': {
            swr: false
        }
    },

    modules: [
        '@nuxt/eslint',
        '@nuxt/image',
        '@nuxt/scripts',
        '@nuxt/ui',
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
    hooks: {
        async 'build:before'() {
            const candidates = [
                resolvePath(resolve('.nuxt'), 'route-rules.mjs'),
                resolvePath(resolve('node_modules/.cache/nuxt/.nuxt'), 'route-rules.mjs')
            ]

            for (const routeRulesFile of candidates) {
                try {
                    await access(routeRulesFile)
                } catch {
                    await mkdir(dirname(routeRulesFile), { recursive: true })
                    await writeFile(routeRulesFile, 'export default function routeRulesMatcher() { return {} }\n', 'utf8')
                }
            }
        }
    },
    runtimeConfig: {
        typo3ApiOrigin: typo3BackendOrigin,
        flickrApiKey,
        flickrUserId,
        upstreamCache: {
            minFreshMs: toInt(process.env.NUXT_UPSTREAM_CACHE_MIN_FRESH_MS, 15_000),
            hardTtlMs: toInt(process.env.NUXT_UPSTREAM_CACHE_HARD_TTL_MS, 21_600_000),
            staleIfErrorMs: toInt(process.env.NUXT_UPSTREAM_CACHE_STALE_IF_ERROR_MS, 86_400_000),
            maxEntries: toInt(process.env.NUXT_UPSTREAM_CACHE_MAX_ENTRIES, 400),
            maxTotalBytes: toInt(process.env.NUXT_UPSTREAM_CACHE_MAX_TOTAL_BYTES, 52_428_800),
            maxBodyBytes: toInt(process.env.NUXT_UPSTREAM_CACHE_MAX_BODY_BYTES, 1_048_576)
        },
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
