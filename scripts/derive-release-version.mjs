import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'

const targetRevision = process.argv[2] || 'HEAD'
const versionPattern = /^(\d+)\.(\d+)\.(\d+)$/
const versionTagPattern = /^(?:candidate-)?v(\d+\.\d+\.\d+)$/

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const parseVersion = (value) => {
  const match = value.match(versionPattern)
  if (!match) {
    throw new Error(`Invalid release version: ${value}`)
  }

  return match.slice(1).map(Number)
}

const targetSha = git('rev-parse', `${targetRevision}^{commit}`)
const exactVersionTag = git('tag', '--points-at', targetSha)
  .split('\n')
  .map((tag) => tag.trim())
  .find((tag) => versionTagPattern.test(tag))

if (exactVersionTag) {
  process.stdout.write(`${exactVersionTag.match(versionTagPattern)[1]}\n`)
  process.exit(0)
}

let baseVersion
let commitRange

try {
  const baseTag = git(
    'describe',
    '--tags',
    '--match',
    'v[0-9]*.[0-9]*.[0-9]*',
    '--match',
    'candidate-v[0-9]*.[0-9]*.[0-9]*',
    '--abbrev=0',
    targetSha
  )
  baseVersion = baseTag.match(versionTagPattern)?.[1] || ''
  parseVersion(baseVersion)
  commitRange = `${baseTag}..${targetSha}`
} catch {
  const packageJson = JSON.parse(readFileSync(new URL('../src/package.json', import.meta.url), 'utf8'))
  baseVersion = String(packageJson.version || '')
  parseVersion(baseVersion)
  commitRange = targetSha
}

const commitMessages = git('log', '--format=%B', commitRange)
const [major, minor, patch] = parseVersion(baseVersion)

let releaseVersion
if (/BREAKING CHANGE|^[a-z]+(?:\([^\n)]*\))?!:/im.test(commitMessages)) {
  releaseVersion = `${major + 1}.0.0`
} else if (/^(?:feat|feature)(?:\([^\n)]*\))?:/im.test(commitMessages)) {
  releaseVersion = `${major}.${minor + 1}.0`
} else {
  releaseVersion = `${major}.${minor}.${patch + 1}`
}

process.stdout.write(`${releaseVersion}\n`)
