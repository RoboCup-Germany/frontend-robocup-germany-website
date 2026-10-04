import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const [manifestPath, image, releaseSha] = process.argv.slice(2)

if (!manifestPath || !image || !releaseSha) {
  throw new Error('Usage: render-deployment-manifest.mjs <manifest> <image> <release-sha>')
}

if (!/^[a-f0-9]{40}$/i.test(releaseSha)) {
  throw new Error(`Invalid release SHA: ${releaseSha}`)
}

if (/\s/.test(image) || !image.includes('/')) {
  throw new Error(`Invalid image reference: ${image}`)
}

const lines = (await readFile(manifestPath, 'utf8')).split('\n')
let imageUpdated = false
let releaseUpdated = false

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
    releaseUpdated = true
  }
}

if (!imageUpdated || !releaseUpdated) {
  throw new Error(`Could not update image and NUXT_RELEASE_SHA in ${manifestPath}`)
}

await writeFile(manifestPath, lines.join('\n'), 'utf8')
