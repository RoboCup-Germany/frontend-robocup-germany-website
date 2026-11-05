import { isWorkspacePreviewRequest } from '~/server/utils/workspace-preview'

const previewCacheControl = 'private, no-store'

// The TYPO3 workspace module shows previews in an iframe on the backend domain.
// Nitro marks error responses as not embeddable (X-Frame-Options: DENY), which made the browser
// refuse the whole preview frame instead of showing the error page.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    if (!isWorkspacePreviewRequest(event)) return

    const res = event.node.res
    const setHeader = res.setHeader.bind(res)

    res.setHeader = (name, value) => {
      const key = name.toLowerCase()

      if (key === 'x-frame-options') return res
      if (key === 'cache-control') return setHeader(name, previewCacheControl)
      if (key === 'content-security-policy') {
        const policy = String(value).replace(/frame-ancestors[^;]*;?\s*/i, '').trim()
        return policy ? setHeader(name, policy) : res
      }

      return setHeader(name, value)
    }

    setHeader('cache-control', previewCacheControl)
    setHeader('x-robots-tag', 'noindex, nofollow')
  })
})
