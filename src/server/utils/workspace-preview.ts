import { getQuery, parseCookies, proxyRequest, removeResponseHeader, type H3Event } from 'h3'

// TYPO3 workspace preview keyword. The TYPO3 workspace module embeds draft pages with `?ADMCMD_prev=<keyword>`.
export const WORKSPACE_PREVIEW_PARAM = 'ADMCMD_prev'

export const isWorkspacePreviewRequest = (event: H3Event): boolean => {
  return Boolean(getQuery(event)[WORKSPACE_PREVIEW_PARAM] || parseCookies(event)[WORKSPACE_PREVIEW_PARAM])
}

// Draft content must never reach the shared upstream cache, so preview requests always go straight to TYPO3.
export const proxyWorkspacePreview = (
  event: H3Event,
  target: string,
  headers: Record<string, string | string[] | undefined>
) => {
  return proxyRequest(event, target, {
    headers,
    onResponse: (proxyEvent) => {
      // TYPO3 answers with an ADMCMD_prev cookie. Keep the preview bound to the URL instead of the browser.
      removeResponseHeader(proxyEvent, 'set-cookie')
    }
  })
}
