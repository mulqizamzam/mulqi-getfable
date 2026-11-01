#!/usr/bin/env node
// Generate skills/<id>/SKILL.md from skills/registry.json (single source of truth).
// Keeps the bundled skill bodies in lockstep with the catalog the host serves.
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skillsDir = join(root, 'skills')
const registryPath = join(skillsDir, 'registry.json')

let registry
try {
  registry = JSON.parse(await fs.readFile(registryPath, 'utf8'))
} catch {
  console.error('scripts/generate-skills.mjs: skills/registry.json not found; create it first, then keep it in lockstep with src/core/catalog.ts')
  process.exit(1)
}

const skills = registry.skills
await fs.mkdir(skillsDir, { recursive: true })

for (const entry of skills) {
  const dir = join(skillsDir, entry.id)
  await fs.mkdir(dir, { recursive: true })
  const lines = []
  lines.push('---')
  lines.push(`name: ${entry.id}`)
  lines.push(`description: ${JSON.stringify(entry.description)}`)
  lines.push('version: 1.0.0')
  lines.push(`pack: ${entry.pack}`)
  lines.push('inputs:')
  for (const i of entry.inputs) lines.push(`  - ${i}`)
  lines.push('requires:')
  for (const r of entry.requires) lines.push(`  - ${r}`)
  lines.push('produces:')
  for (const p of entry.produces) lines.push(`  - ${p}`)
  lines.push('gates:')
  if (entry.gates.length > 0) for (const g of entry.gates) lines.push(`  - ${g}`)
  else lines.push('  []')
  lines.push(`fallback: ${entry.fallback ?? 'null'}`)
  lines.push(`mutatesWorkspace: ${entry.mutatesWorkspace}`)
  lines.push(`parallelSafe: ${entry.parallelSafe}`)
  lines.push('neural_links:')
  lines.push('  precursors:')
  lines.push('    []')
  lines.push('  continuations:')
  if (entry.next.length > 0) for (const n of entry.next) lines.push(`    - ${n}`)
  else lines.push('    []')
  lines.push('  lateral_peers:')
  lines.push('    []')
  lines.push(`  recovery: ${entry.fallback ?? 'null'}`)
  lines.push('---')
  lines.push('')
  lines.push(`# ${entry.id}`)
  lines.push('')
  lines.push(entry.description)
  lines.push('')
  lines.push('## Activate When')
  for (const k of entry.keywords) lines.push(`- ${k}`)
  lines.push('')
  lines.push('## Inputs')
  for (const i of entry.inputs) lines.push(`- ${i}`)
  lines.push('')
  lines.push('## Produces')
  for (const p of entry.produces) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## Gates')
  if (entry.gates.length > 0) for (const g of entry.gates) lines.push(`- ${g}`)
  else lines.push('- (none)')
  lines.push('')
  lines.push('## Next')
  if (entry.next.length > 0) for (const n of entry.next) lines.push(`- ${n}`)
  else lines.push('- (terminal)')
  lines.push('')
  lines.push('## Fallback')
  lines.push(entry.fallback !== null ? `- ${entry.fallback}` : '- (none - top of the lifecycle)')
  lines.push('')
  await fs.writeFile(join(dir, 'SKILL.md'), lines.join('\n'))
}

console.log(`generated ${skills.length} skills under skills/`)
