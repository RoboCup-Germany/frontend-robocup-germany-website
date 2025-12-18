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
            baseUrl: 'https://api.t3pwa.com'
        }
    },
    css: [
        "~/assets/styles/app/tailwind.css"
    ], runtimeConfig: {
        public: {
            typo3: {
                api: {
                    // LOCALHOST ADDRESS
                    baseUrl: 'https://rc-new-website.ddev.site',
                    // ONLINE ADDRESS
                    // baseUrl: 'https://testwebsite.robocup.de/',
                },
                features: {
                    i18nMiddleware: true,
                }
            },
        }
    }
})