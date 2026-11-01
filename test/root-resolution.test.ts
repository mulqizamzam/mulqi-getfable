/**
 * Regression: the project root must come from the session, not from the host
 * process cwd.
 *
 * `ToolRunContext` carries no cwd of its own, so the service resolves one
 * through the host's `workingDirectory` service keyed by `exec.agent`. Before
 * this test existed, every read and repair fell back to `process.cwd()` — the
 * DSH checkout — so a `doctor({fix:true})` wrote `.fable/state.json` into the
 * harness repository instead of the workspace the session was working in.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GfPolicy } from '../src/policy-service.ts'

function makeCtx(cwd?: string) {
  const tools: unknown[] = []
  const ctx = {
    tools: { register: (def: unknown) => { tools.push(def); return () => {} } },
    skills: {
      registerProvider: (create: (c: unknown) => unknown) => {
        create({})
        return () => {}
      },
    },
    on: () => {},
    inject: (_d: readonly string[], fn: (i: unknown) => void) => fn({}),
    log: { info: () => {}, debug: () => {} },
    reflect: { provide: () => {} },
    effect: () => () => {},
    get: (name: string) =>
      name === 'workingDirectory' && cwd !== undefined
        ? { ensure: async () => cwd }
        : undefined,
  }
  return { ctx, tools }
}

describe('project root resolution', () => {
  it('reads .fable from the session cwd the workingDirectory service reports', async () => {
    const root = mkdtempSync(join(tmpdir(), 'gf-root-'))
    mkdirSync(join(root, '.fable'), { recursive: true })
    writeFileSync(
      join(root, '.fable', 'state.json'),
      JSON.stringify({
        schemaVersion: 3,
        phase: 'planned',
        mutationGeneration: 0,
        verifiedGeneration: 0,
        failStreak: 0,
        activeCard: null,
        cards: [],
        attestationSha: null,
        updatedAt: new Date().toISOString(),
      }),
    )

    const { ctx, tools } = makeCtx(root)
    new GfPolicy(ctx as never)

    const status = tools.find(
      (t) => (t as { name: string }).name === 'gf_status',
    ) as unknown as { execute: (a: unknown, e: unknown) => Promise<unknown> }

    // The exec has an agent and no cwd field: only the workingDirectory
    // service can point the service at the project.
    const out = (await status.execute({}, { agent: { id: 'test' } })) as {
      ok: boolean
      value: { phase: string; doctor: boolean }
    }

    expect(out.ok).toBe(true)
    expect(out.value.phase).toBe('planned')
    expect(out.value.doctor).toBe(true)

    rmSync(root, { recursive: true, force: true })
  })
})
