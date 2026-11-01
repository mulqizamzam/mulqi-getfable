/**
 * Service-level test: boot a minimal cordis app with the GfPolicy service and
 * prove M3 — the service mounts, registers its tools, and the tool bodies
 * return the discriminated envelope.
 *
 * The host's real `tools`/`skills`/`sessions` services are not available in a
 * unit context, so we supply minimal stand-ins that record registrations. This
 * is a seam test: it exercises the service's wiring, not the host.
 */
import { describe, expect, it, vi } from 'vitest'
import { GfPolicy } from '../src/policy-service.ts'

/**
 * A stand-in Context: just enough surface for the service constructor.
 * `tools.register` records the definition; `skills.registerProvider` records
 * the provider; `on`/`inject`/`log` are no-ops that record.
 */
function makeCtx() {
  const registeredTools: unknown[] = []
  const registeredProviders: unknown[] = []
  const events: Array<[string, unknown]> = []
  const injected: unknown[] = []
  const ctx = {
    tools: {
      register(def: unknown) {
        registeredTools.push(def)
        return () => {}
      },
    },
    skills: {
      registerProvider(create: (control: unknown) => unknown) {
        const provider = create({})
        registeredProviders.push(provider)
        return () => {}
      },
    },
    on(event: string, listener: unknown) {
      events.push([event, listener])
    },
    inject(_deps: readonly string[], fn: (injected: unknown) => void) {
      // No `connection` service in the unit context: hand a context without it.
      injected.push('called')
      fn({})
    },
    log: { info: () => {}, debug: () => {} },
    // The Service base constructor calls `ctx.reflect.provide(name, self, check)`.
    // A minimal stand-in lets the service mount in a plain unit test without a
    // full cordis fiber; the real host provides the genuine registry.
    reflect: {
      provide() {
        /* no-op in the seam test */
      },
    },
    effect() {
      return () => {}
    },
  }
  return { ctx, registeredTools, registeredProviders, events, injected }
}

describe('GfPolicy service wiring', () => {
  it('registers the four canonical tools', () => {
    const { ctx, registeredTools } = makeCtx()
    new GfPolicy(ctx as never)
    const names = registeredTools.map((d) => (d as { name: string }).name)
    expect(names).toEqual(
      expect.arrayContaining(['gf_status', 'gf_route', 'gf_doctor', 'gf_skills']),
    )
    expect(names).toHaveLength(4)
  })

  it('registers a bundled skill provider', () => {
    const { ctx, registeredProviders } = makeCtx()
    new GfPolicy(ctx as never)
    expect(registeredProviders).toHaveLength(1)
    const provider = registeredProviders[0] as { name: string; list: () => Promise<unknown[]> }
    expect(provider.name).toBe('mulqi-getfable')
    return provider.list().then((list) => {
      expect(list.length).toBeGreaterThanOrEqual(16)
      const ids = list.map((e) => (e as { name: string }).name)
      expect(ids).toEqual(expect.arrayContaining(['get-fable', 'fable-discover', 'fable-recover']))
    })
  })

  it('wires the four observational event hooks', () => {
    const { ctx, events } = makeCtx()
    new GfPolicy(ctx as never)
    const wired = events.map(([e]) => e)
    expect(wired).toEqual(
      expect.arrayContaining(['agent/pre-step', 'tools/execute', 'tools/result', 'session/event']),
    )
  })

  it('tool bodies return a discriminated envelope', async () => {
    const { ctx, registeredTools } = makeCtx()
    new GfPolicy(ctx as never)
    // Resolve a project root without a .fable directory so the bodies take
    // the no-project path and still return ok envelopes.
    process.chdir('/tmp')
    const byName = new Map(registeredTools.map((d) => [(d as { name: string }).name, d]))
    const status = byName.get('gf_status') as unknown as { execute: (a: unknown, e: unknown) => Promise<unknown> }
    const statusOut = (await status.execute({}, { context: { cwd: '/tmp' } })) as { ok: boolean; value: { phase: string; doctor: boolean } }
    expect(statusOut.ok).toBe(true)
    expect(typeof statusOut.value.phase).toBe('string')
    expect(typeof statusOut.value.doctor).toBe('boolean')
  })
})
