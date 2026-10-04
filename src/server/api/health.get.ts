import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  setResponseHeader(event, 'cache-control', 'no-store')

  return {
    status: 'ok',
    release: String(config.releaseSha || 'development')
  }
})
