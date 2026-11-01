#!/usr/bin/env node
// Validate the shipped bundle: artifact shapes + zero-upstream-refs on the
// runtime surface a consumer actually loads (lib/, skills/, src/ and the root
// package manifest). Docs and build tooling are intentionally NOT scanned:
// naming the upstream project this was decoupled from is provenance, not a
// live link, and only lives in README/scripts.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

// 1. Bundles exist.
for (const art of ['lib/index.js', 'lib/client.js']) {
  if (!existsSync(join(root, art))) failures.push(`missing artifact: ${art}`)
}

// 2. Client bundle carries the __ModuleLoader__ registration with the right id.
const client = existsSync(join(root, 'lib/client.js'))
  ? readFileSync(join(root, 'lib/client.js'), 'utf8')
  : ''
if (!/^window\.__ModuleLoader__\.load\(\{\s*id:\s*"mulqi-getfable",/s.test(client)) {
  failures.push('lib/client.js: not a __ModuleLoader__ bundle with id "mulqi-getfable"')
}

// 3. Host bundle exports the Service and the version. The expected version
// comes from the manifest, so a release bump cannot silently fail validation.
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = String(manifest.version ?? '')
if (version === '') failures.push('package.json: version missing')
const host = existsSync(join(root, 'lib/index.js'))
  ? readFileSync(join(root, 'lib/index.js'), 'utf8')
  : ''
if (!host.includes('GfPolicy')) failures.push('lib/index.js: GfPolicy service not found')
if (version !== '' && !host.includes(version)) {
  failures.push(`lib/index.js: version constant ${version} not found`)
}

// 4. Zero foreign plugin refs across the shipped runtime surface.
const foreignPatterns =
  /\.claude-plugin|\.codex-plugin|\.chatgpt-plugin|\.cursor-plugin/i

function scanDir(dir, depth) {
  if (depth > 4) return
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const p = join(dir, entry.name)
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.pnpm-store') continue
    if (entry.isDirectory()) scanDir(p, depth + 1)
    else if (/\.(js|ts|json|md|yml|yaml|mjs)$/i.test(entry.name)) {
      const text = readFileSync(p, 'utf8')
      if (foreignPatterns.test(text)) failures.push(`foreign reference in ${p.replace(root, '.')}`)
    }
  }
}
// Only the directories a consumer loads at runtime + the root manifest.
for (const target of ['lib', 'skills', 'src']) scanDir(join(root, target), 0)
for (const manifest of ['package.json', 'cordis.patch.yml']) {
  const p = join(root, manifest)
  if (existsSync(p) && foreignPatterns.test(readFileSync(p, 'utf8'))) {
    failures.push(`foreign reference in ${manifest}`)
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error('  \u2716 ' + f)
  console.error(`validate: ${failures.length} violation(s)`)
  process.exit(1)
}
console.log('validate: shipped bundle clean \u2014 artifacts present, zero foreign plugin references')
