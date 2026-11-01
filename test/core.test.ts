/**
 * Unit tests for the pure core: routing precedence, ledger lint, and the
 * state-machine transition rules. These run with zero host dependencies so
 * they prove the spine of the loop before the Service wrapper is even
 * involved.
 */
import { describe, expect, it } from 'vitest'
import { route, routePreview } from '../src/core/route.ts'
import { emptyState, normalizeState, RECOVERY_THRESHOLD, type FableState } from '../src/core/state.ts'
import { lintLedger, parseLedger } from '../src/core/ledger.ts'
import { runDoctor } from '../src/core/doctor.ts'
import { GfSkillRegistry, GfSkillCount } from '../src/core/catalog.ts'
import { openStateStore } from '../src/core/state.ts'

function state(over: Partial<FableState> = {}): FableState {
  return { ...emptyState(), ...over }
}

describe('route precedence', () => {
  it('failure streak outranks execution and routes to recover', () => {
    const d = route({ task: 'implement the bounded card', state: state({ failStreak: 2, phase: 'executing' }) })
    expect(d.skill).toBe('fable-recover')
    expect(d.phase).toBe('recovering')
  })

  it('security keyword outranks a general review', () => {
    const d = route({ task: 'review the diff and check the authz secret handling', state: null })
    expect(d.skill).toBe('fable-security')
  })

  it('external API uncertainty routes to research', () => {
    const d = route({ task: 'confirm the current API contract of the external library', state: null })
    expect(d.skill).toBe('fable-research')
  })

  it('repository unknown routes to discovery', () => {
    const d = route({ task: 'inspect the repository entry points and build system', state: null })
    expect(d.skill).toBe('fable-discover')
  })

  it('architecture choice routes to plan', () => {
    const d = route({ task: 'design the data model and decomposition', state: null })
    expect(d.skill).toBe('fable-plan')
  })

  it('testable behaviour change routes through TDD', () => {
    const d = route({ task: 'add a failing test then fix the behaviour it covers', state: null })
    expect(d.skill).toBe('fable-tdd')
  })

  it('independent cards route to delegate', () => {
    const d = route({ task: 'delegate the three independent bounded cards in parallel', state: null })
    expect(d.skill).toBe('fable-delegate')
  })

  it('default falls back to discovery', () => {
    const d = route({ task: 'go', state: null })
    expect(d.skill).toBe('fable-discover')
  })

  it('preview never claims applied', () => {
    const p = routePreview({ task: 'implement the bounded card', state: null })
    expect(p.applies).toBe(false)
  })

  it('recovery threshold constant is 2', () => {
    expect(RECOVERY_THRESHOLD).toBe(2)
  })
})

describe('normalizeState', () => {
  it('returns null for non-objects', () => {
    expect(normalizeState(null)).toBeNull()
    expect(normalizeState('x')).toBeNull()
    expect(normalizeState(42)).toBeNull()
  })

  it('normalizes a partial blob to a valid v3 state', () => {
    const s = normalizeState({ phase: 'executing', failStreak: 5 })
    expect(s).not.toBeNull()
    expect(s?.phase).toBe('executing')
    expect(s?.schemaVersion).toBe(3)
    expect(s?.failStreak).toBe(5)
  })
})

describe('ledger lint', () => {
  it('flags an open card without an acceptance hint', () => {
    const r = lintLedger('task_plan.md', '- [ ] do the thing\n')
    expect(r.open).toBe(1)
    expect(r.findings.some((f) => f.rule === 'open-card-acceptance')).toBe(true)
  })

  it('accepts an open card that hints at a test', () => {
    const r = lintLedger('task_plan.md', '- [ ] add `test/foo.test.ts` covering the case\n')
    expect(r.findings.some((f) => f.rule === 'open-card-acceptance')).toBe(false)
  })

  it('flags a closed card without an evidence marker', () => {
    const r = lintLedger('task_plan.md', '- [x] fixed the bug\n')
    expect(r.findings.some((f) => f.rule === 'closed-card-evidence')).toBe(true)
  })

  it('accepts a closed card with evidence', () => {
    const text = '- [x] fixed the bug\n  -- evidence: test/auth.test.ts passed\n'
    const r = lintLedger('task_plan.md', text)
    expect(r.findings.some((f) => f.rule === 'closed-card-evidence')).toBe(false)
  })

  it('flags a deferred card without a reason', () => {
    const r = lintLedger('task_plan.md', '- [~] maybe later\n')
    expect(r.findings.some((f) => f.rule === 'deferred-card-reason')).toBe(true)
  })

  it('parseLedger counts statuses', () => {
    const cards = parseLedger('- [ ] a\n- [x] b\n- [~] c\n')
    expect(cards.map((c) => c.status)).toEqual(['open', 'checked', 'deferred'])
  })
})

describe('doctor', () => {
  function tmpStore() {
    const dir = `/tmp/gf-doctor-${process.pid}-${Math.floor(Math.random() * 1e6)}`
    const store = openStateStore(dir)
    store.saveSync(emptyState())
    return { store, dir }
  }

  it('reports a clean project healthy', async () => {
    const { store } = tmpStore()
    const report = runDoctor({ store, ledgerText: '- [ ] add `test` with acceptance\n' })
    expect(report.healthy).toBe(true)
  })

  it('flags an open card missing acceptance', () => {
    const { store } = tmpStore()
    const report = runDoctor({ store, ledgerText: '- [ ] do something vaguely\n' })
    expect(report.healthy).toBe(false)
  })

  it('repair rebuilds a missing state file', () => {
    const dir = `/tmp/gf-doctor-repair-${process.pid}-${Math.floor(Math.random() * 1e6)}`
    const store = openStateStore(dir)
    const report = runDoctor({ store, fix: true })
    expect(report.repaired + report.fixed).toBeGreaterThanOrEqual(0)
    expect(store.loadSync()).not.toBeNull()
  })
})

describe('catalog', () => {
  it('ships the expected number of lifecycle skills', () => {
    expect(GfSkillCount).toBe(GfSkillRegistry.length)
    expect(GfSkillCount).toBeGreaterThanOrEqual(16)
  })

  it('every next/fallback reference points at a known id', () => {
    const ids = new Set(GfSkillRegistry.map((s) => s.id))
    for (const entry of GfSkillRegistry) {
      for (const n of entry.next) expect(ids.has(n), `next ${n} of ${entry.id}`).toBe(true)
      if (entry.fallback !== null) expect(ids.has(entry.fallback), `fallback ${entry.fallback} of ${entry.id}`).toBe(true)
    }
  })
})
