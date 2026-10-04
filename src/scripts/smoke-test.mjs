import process from 'node:process'

const frontendUrls = String(process.env.FRONTEND_URLS || '')
  .split(',')
  .map((value) => value.trim().replace(/\/+$/, ''))
  .filter(Boolean)
const backendUrl = String(process.env.BACKEND_URL || '').trim().replace(/\/+$/, '')
const expectedRelease = String(process.env.EXPECTED_RELEASE_SHA || '').trim()
const expectedVersion = String(process.env.EXPECTED_RELEASE_VERSION || '').trim()
const attempts = Number.parseInt(process.env.SMOKE_ATTEMPTS || '30', 10)
const delayMs = Number.parseInt(process.env.SMOKE_DELAY_MS || '10000', 10)

if (frontendUrls.length === 0) {
  throw new Error('FRONTEND_URLS must contain at least one URL')
}

if (!expectedRelease) {
  throw new Error('EXPECTED_RELEASE_SHA is required')
}

if (!expectedVersion) {
  throw new Error('EXPECTED_RELEASE_VERSION is required')
}

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
    ...options
  })

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }

  return response
}

const waitForRelease = async (baseUrl) => {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await request(`${baseUrl}/api/health`, {
        headers: { 'cache-control': 'no-cache' }
      })
      const health = await response.json()

      if (health.status !== 'ok') {
        throw new Error(`${baseUrl} reported health status ${String(health.status)}`)
      }

      if (health.release !== expectedRelease) {
        throw new Error(`${baseUrl} runs ${String(health.release)}, expected ${expectedRelease}`)
      }

      if (health.version !== expectedVersion) {
        throw new Error(`${baseUrl} runs version ${String(health.version)}, expected ${expectedVersion}`)
      }

      return
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await sleep(delayMs)
      }
    }
  }

  throw lastError
}

for (const frontendUrl of frontendUrls) {
  await waitForRelease(frontendUrl)
  const page = await request(`${frontendUrl}/`, {
    headers: { 'cache-control': 'no-cache' }
  })
  const html = await page.text()

  if (!html.toLowerCase().includes('<!doctype html')) {
    throw new Error(`${frontendUrl} did not return an HTML document`)
  }
}

if (backendUrl) {
  await request(backendUrl, {
    headers: {
      accept: 'application/json, text/html;q=0.9, */*;q=0.8',
      'cache-control': 'no-cache'
    }
  })
}

console.log(`Smoke tests passed for version ${expectedVersion}, release ${expectedRelease}`)
