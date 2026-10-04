import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const [manifestPath, image, releaseSha, releaseVersion] = process.argv.slice(2)

if (!manifestPath || !image || !releaseSha || !releaseVersion) {
  throw new Error('Usage: render-deployment-manifest.mjs <manifest> <image> <release-sha> <release-version>')
}

if (!/^[a-f0-9]{40}$/i.test(releaseSha)) {
  throw new Error(`Invalid release SHA: ${releaseSha}`)
}

if (!/^\d+\.\d+\.\d+$/.test(releaseVersion)) {
  throw new Error(`Invalid release version: ${releaseVersion}`)
}

if (/\s/.test(image) || !image.includes('/')) {
  throw new Error(`Invalid image reference: ${image}`)
}

const lines = (await readFile(manifestPath, 'utf8')).split('\n')
let imageUpdated = false
let releaseShaUpdated = false
let releaseVersionUpdated = false

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index]

  if (!imageUpdated && /^\s*- image:\s*\S+\s*$/.test(line)) {
    const indentation = line.match(/^\s*/)?.[0] || ''
    lines[index] = `${indentation}- image: ${image}`
    imageUpdated = true
  }

  if (line.trim() === '- name: NUXT_RELEASE_SHA') {
    const valueLine = lines[index + 1] || ''
    if (!/^\s*value:\s*/.test(valueLine)) {
      throw new Error(`NUXT_RELEASE_SHA in ${manifestPath} has no value line`)
    }

    const indentation = valueLine.match(/^\s*/)?.[0] || ''
    lines[index + 1] = `${indentation}value: "${releaseSha}"`
    releaseShaUpdated = true
  }

  if (line.trim() === '- name: NUXT_RELEASE_VERSION') {
    const valueLine = lines[index + 1] || ''
    if (!/^\s*value:\s*/.test(valueLine)) {
      throw new Error(`NUXT_RELEASE_VERSION in ${manifestPath} has no value line`)
    }

    const indentation = valueLine.match(/^\s*/)?.[0] || ''
    lines[index + 1] = `${indentation}value: "${releaseVersion}"`
    releaseVersionUpdated = true
  }
}

if (!imageUpdated || !releaseShaUpdated || !releaseVersionUpdated) {
  throw new Error(`Could not update image, NUXT_RELEASE_SHA and NUXT_RELEASE_VERSION in ${manifestPath}`)
}

await writeFile(manifestPath, lines.join('\n'), 'utf8')
