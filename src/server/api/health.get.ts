import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  setResponseHeader(event, 'cache-control', 'no-store')

  return {
    status: 'ok',
    version: String(config.releaseVersion || 'development'),
    release: String(config.releaseSha || 'development')
  }
})
