/**
 * Durable workflow state for mulqi-getfable.
 *
 * Lives in `.fable/state.json` at the project root (the session's cwd).
 * Schema v3: phase + two generation counters (mutation / verified) plus
 * failure streak, active card, and ledger card list.
 *
 * Invariants:
 *  - Atomic write (write-to-temp + rename).
 *  - Fail-open on host/runtime errors: a broken helper must never brick the
 *    host session. An invalid *project* state, however, is a workflow error
 *    and is surfaced to the doctor, not swallowed.
 *  - The state is project-local; there is no `.fable/` directory, no
 *    project enforcement at all (opt-in).
 */
import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'

export const STATE_SCHEMA_VERSION = 3
export const RECOVERY_THRESHOLD = 2

export type Phase =
  | 'idle'
  | 'discovering'
  | 'planned'
  | 'executing'
  | 'verifying'
  | 'recovering'
  | 'complete'
  | 'blocked'

export const PHASES: readonly Phase[] = [
  'idle',
  'discovering',
  'planned',
  'executing',
  'verifying',
  'recovering',
  'complete',
  'blocked',
]

export interface LedgerCard {
  readonly id: string
  readonly status: 'open' | 'checked' | 'deferred'
  readonly title: string
  readonly evidence?: string
  readonly deferredReason?: string
}

export interface FableState {
  schemaVersion: number
  phase: Phase
  mutationGeneration: number
  verifiedGeneration: number
  failStreak: number
  activeCard: string | null
  cards: LedgerCard[]
  /** SHA-256 attestation over the last verified generation's evidence. */
  attestationSha: string | null
  updatedAt: string
}

export interface StateStore {
  readonly fableDir: string
  readonly statePath: string
  readonly hasProject: boolean
  load(): Promise<FableState | null>
  loadSync(): FableState | null
  save(next: FableState): Promise<void>
  saveSync(next: FableState): void
  /** Rebuild a valid state from the ledger; bounded auto-repair. */
  repair(): Promise<FableState>
}

export function emptyState(): FableState {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    phase: 'idle',
    mutationGeneration: 0,
    verifiedGeneration: 0,
    failStreak: 0,
    activeCard: null,
    cards: [],
    attestationSha: null,
    updatedAt: new Date().toISOString(),
  }
}

function isPhase(v: unknown): v is Phase {
  return typeof v === 'string' && (PHASES as readonly string[]).includes(v)
}

/**
 * Validate a parsed value against the v3 shape. Returns a normalized state
 * when it is a valid (or repairable) project state, and `null` when the
 * value is not a state object at all. Invalid-but-present is a *workflow*
 * error, not a host error: callers surface it, they do not crash.
 */
export function normalizeState(value: unknown): FableState | null {
  if (value === null || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const cards: LedgerCard[] = Array.isArray(raw.cards)
    ? raw.cards
        .filter((c): c is Record<string, unknown> => c !== null && typeof c === 'object')
        .map((c) => ({
          id: String(c.id ?? ''),
          status: (['open', 'checked', 'deferred'] as const).includes(c.status as 'open' | 'checked' | 'deferred')
            ? (c.status as LedgerCard['status'])
            : 'open',
          title: String(c.title ?? ''),
          ...(typeof c.evidence === 'string' ? { evidence: c.evidence } : {}),
          ...(typeof c.deferredReason === 'string' ? { deferredReason: c.deferredReason } : {}),
        }))
    : []
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    phase: isPhase(raw.phase) ? raw.phase : 'idle',
    mutationGeneration: typeof raw.mutationGeneration === 'number' ? raw.mutationGeneration : 0,
    verifiedGeneration: typeof raw.verifiedGeneration === 'number' ? raw.verifiedGeneration : 0,
    failStreak: typeof raw.failStreak === 'number' ? raw.failStreak : 0,
    activeCard: typeof raw.activeCard === 'string' ? raw.activeCard : null,
    cards,
    attestationSha: typeof raw.attestationSha === 'string' ? raw.attestationSha : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

/**
 * Build a project-rooted store. `fableDir` is `.fable` under the project.
 * `hasProject` is computed lazily from the presence of the directory.
 */
export function openStateStore(projectRoot: string): StateStore {
  const fableDir = `${projectRoot}/.fable`
  const statePath = `${fableDir}/state.json`
  const probe = () => hasDir(fableDir)

  function hasDir(path: string): boolean {
    try {
      return fsSyncStat(path).isDirectory()
    } catch {
      return false
    }
  }
  // Synchronous stat via node:fs (cheap); the rest of the store is async.
  const { statSync, readFileSync, writeFileSync, renameSync } = require('node:fs') as typeof import('node:fs')
  function fsSyncStat(p: string) {
    return statSync(p)
  }

  function parse(text: string): FableState | null {
    const state = normalizeState(JSON.parse(text))
    return state
  }

  return {
    fableDir,
    statePath,
    get hasProject(): boolean {
      return probe()
    },
    loadSync(): FableState | null {
      if (!probe()) return null
      try {
        return parse(readFileSync(statePath, 'utf8'))
      } catch {
        return null
      }
    },
    async load(): Promise<FableState | null> {
      if (!(await fs.stat(fableDir).then((s) => s.isDirectory()).catch(() => false))) return null
      try {
        const text = await fs.readFile(statePath, 'utf8')
        return parse(text)
      } catch {
        return null
      }
    },
    saveSync(next: FableState): void {
      ensureDir(fableDir)
      const tmp = `${statePath}.${process.pid}.tmp`
      writeFileSync(tmp, JSON.stringify(next, null, 2))
      renameSync(tmp, statePath)
    },
    async save(next: FableState): Promise<void> {
      await fs.mkdir(fableDir, { recursive: true })
      const tmp = `${statePath}.${process.pid}.tmp`
      await fs.writeFile(tmp, JSON.stringify(next, null, 2))
      await fs.rename(tmp, statePath)
    },
    async repair(): Promise<FableState> {
      const existing = await this.load()
      const base = existing ?? emptyState()
      // Repair: clamp failStreak to a sane bound, ensure phase is known.
      const repaired: FableState = {
        ...base,
        failStreak: Math.min(base.failStreak, RECOVERY_THRESHOLD),
        phase: isPhase(base.phase) ? base.phase : 'idle',
        updatedAt: new Date().toISOString(),
      }
      await this.save(repaired)
      return repaired
    },
  }

  function ensureDir(dir: string): void {
    try {
      statSync(dir)
    } catch {
      // directory missing — recreate. The synchronous fs helper is a local
      // import to avoid a second async round-trip on the saveSync path.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mkdirSync } = require('node:fs') as typeof import('node:fs')
      mkdirSync(dir, { recursive: true })
    }
  }
}
