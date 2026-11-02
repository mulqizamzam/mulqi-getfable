/**
 * Tests for the gf_handoff document builder.
 *
 * The handoff is the one artifact another session reads when this one stops.
 * These tests pin the contract: it must carry the durable state, the active
 * card, the open ledger cards, the open findings, and an explicit re-verify
 * list — and it must stay honest when the project is not opted in.
 */
import { describe, expect, it } from 'vitest'
import { buildHandoff } from '../src/core/handoff.ts'
import { emptyState, type FableState } from '../src/core/state.ts'

function state(over: Partial<FableState> = {}): FableState {
  return { ...emptyState(), ...over }
}

describe('buildHandoff', () => {
  it('carries phase, failure streak, and the active card', () => {
    const doc = buildHandoff({
      projectRoot: '/tmp/proj',
      version: '1.0.1',
      hasProject: true,
      state: state({ phase: 'executing', failStreak: 1, activeCard: 'card-3' }),
    })
    expect(doc.markdown).toContain('phase: executing')
    expect(doc.markdown).toContain('failStreak: 1/2')
    expect(doc.markdown).toContain('card-3')
  })

  it('lists open cards as what remains and checked cards as done', () => {
    const doc = buildHandoff({
      projectRoot: '/tmp/proj',
      version: '1.0.1',
      hasProject: true,
      state: state({
        cards: [
          { id: 'a', status: 'open', title: 'add `test/handoff.test.ts`' },
          { id: 'b', status: 'checked', title: 'wire the tool', evidence: 'test/service.test.ts passed' },
        ],
      }),
    })
    expect(doc.markdown).toContain('What remains')
    expect(doc.markdown).toContain('add `test/handoff.test.ts`')
    expect(doc.markdown).toContain('wire the tool')
  })

  it('puts unverified mutation debt on the re-verify list', () => {
    const doc = buildHandoff({
      projectRoot: '/tmp/proj',
      version: '1.0.1',
      hasProject: true,
      state: state({ mutationGeneration: 3, verifiedGeneration: 1 }),
    })
    expect(doc.reVerify.some((line) => line.includes('2 generation'))).toBe(true)
    expect(doc.markdown).toContain('Re-verify before trusting')
  })

  it('surfaces ledger lint findings as open findings', () => {
    const doc = buildHandoff({
      projectRoot: '/tmp/proj',
      version: '1.0.1',
      hasProject: true,
      state: state(),
      ledgerText: '- [x] fixed the bug\n',
    })
    expect(doc.markdown).toContain('Open findings')
    expect(doc.markdown).toContain('closed-card-evidence')
  })

  it('stays honest when the project is not opted in', () => {
    const doc = buildHandoff({ projectRoot: '/tmp/proj', version: '1.0.1', hasProject: false, state: null })
    expect(doc.markdown).toContain('not opted in')
    expect(doc.markdown).toContain('no .fable/')
  })

  it('names the project root and the plugin version', () => {
    const doc = buildHandoff({
      projectRoot: '/tmp/proj',
      version: '1.0.1',
      hasProject: true,
      state: state(),
    })
    expect(doc.markdown).toContain('/tmp/proj')
    expect(doc.markdown).toContain('1.0.1')
  })

  it('is self-contained: no reference to another session id or external path', () => {
    const doc = buildHandoff({
      projectRoot: '/tmp/proj',
      version: '1.0.1',
      hasProject: true,
      state: state({ activeCard: 'card-1' }),
    })
    expect(doc.markdown).not.toMatch(/session-[0-9a-f-]{8,}/)
    expect(doc.markdown).not.toContain('http://')
  })
})
