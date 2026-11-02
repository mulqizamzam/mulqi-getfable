/**
 * GfPolicy — the mulqi-getfable host policy service.
 *
 * One service is the plugin: it owns the durable state machine, the
 * deterministic router, the doctor, the bundled skill provider, the four
 * tools, and the four observational hooks. Registered as `ctx.gf`.
 *
 * Injects `tools` and `skills` (always present on the host). The web-only
 * `connection` service is reached lazily by the host entry
 * (`src/host/index.ts`), so a headless profile still boots cleanly.
 *
 * Every hook is fail-open: a helper error never throws into the host session.
 * Malformed *project* state is surfaced to the doctor, not raised.
 */
import { existsSync, readFileSync } from 'node:fs'
import { Service, type Context } from '@deepseek-ai/cordis'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { GfSkillRegistry, renderSkillBody, type GfSkillEntry } from './core/catalog.ts'
import { runDoctor } from './core/doctor.ts'
import { buildHandoff, type HandoffDocument } from './core/handoff.ts'
import { route, routePreview, type RouteDecision } from './core/route.ts'
import { openStateStore, emptyState, type FableState } from './core/state.ts'
import {
  type GfDoctorReport,
  type GfPing,
  type GfPlanSnapshot,
  type GfResult,
  type GfRouteRequest,
  type GfRouteResponse,
  type GfSkillInfo,
  type GfStatusSnapshot,
} from './core/wire.ts'

export const PLUGIN_VERSION = '1.0.1'

declare module '@deepseek-ai/cordis' {
  interface Context {
    readonly gf: GfPolicy
  }
}

type GfToolRuntime = import('@deepseek-ai/dsh-tools').ToolRuntime
type GfSkillRegistry = import('@deepseek-ai/dsh-skill').SkillRegistry

export class GfPolicy extends Service {
  static inject = ['tools', 'skills'] as const

  constructor(ctx: Context) {
    super(ctx, 'gf')
    this.wireTools()
    this.wireHooks()
    this.wireSkillProvider()
  }

  // --------------------------------------------------------------- tools

  private wireTools(): void {
    const tools = (this.ctx as unknown as { tools: GfToolRuntime }).tools
    tools.register(this.toolSpec('gf_status', 'Return the canonical mulqi-getfable runtime state: active phase, failure streak against the recovery threshold, unverified mutation debt, plan progress, and doctor health.', async (_args, exec) => ok(this.status(await this.resolveRoot(exec)))))
    tools.register(this.toolSpec('gf_route', 'Execute the mulqi-getfable task router on a task string. Read-only by default (apply omitted/false); apply:true persists the decision into the durable .fable state.', (args, exec) => this.routeTool(args, exec), routeParams()))
    tools.register(this.toolSpec('gf_doctor', 'Run bounded mulqi-getfable diagnostics over the .fable project state. With fix:true, perform one idempotent bounded repair and report what it changed.', (args, exec) => this.doctorTool(args, exec), doctorParams()))
    tools.register(this.toolSpec('gf_skills', 'Return the registry of mulqi-getfable canonical lifecycle skills with categories and load state.', () => ok(this.skillInfos())))
    tools.register(this.toolSpec('gf_handoff', 'Produce a complete, self-contained handoff document for another session or agent: durable state, active card, what remains, open ledger findings, and an explicit re-verify list. Read-only.', async (_args, exec) => ok(await this.handoffTool(exec))))
  }

  private async handoffTool(exec: ToolRunContext): Promise<HandoffDocument> {
    const root = await this.resolveRoot(exec)
    const store = this.storeFor(root)
    const state = store.hasProject ? store.loadSync() : null
    let ledgerText: string | undefined
    try {
      const candidate = `${store.fableDir}/task_plan.md`
      const atRoot = `${store.fableDir.slice(0, -'.fable'.length)}/task_plan.md`
      const path = existsSync(candidate) ? candidate : atRoot
      if (existsSync(path)) ledgerText = readFileSync(path, 'utf8')
    } catch {
      ledgerText = undefined
    }
    return buildHandoff({
      projectRoot: root,
      version: PLUGIN_VERSION,
      hasProject: store.hasProject && state !== null,
      state,
      ledgerText,
    })
  }

  private async routeTool(args: Record<string, unknown>, exec: ToolRunContext): Promise<unknown> {
    const task = typeof args.task === 'string' ? args.task : ''
    if (task === '') return fail('bad-request', 'gf_route requires a non-empty task string')
    return this.routeResponse({ task, apply: args.apply === true }, await this.resolveRoot(exec))
  }

  private async doctorTool(args: Record<string, unknown>, exec: ToolRunContext): Promise<unknown> {
    return this.doctor(args.fix === true, await this.resolveRoot(exec))
  }

  /**
   * Resolve the session's project root -- the single place that maps an exec
   * onto a directory.
   *
   * `ToolRunContext` carries no cwd of its own; the host exposes the session
   * working directory through the `workingDirectory` service, keyed by the
   * exec's agent. Fall back to the host process cwd only when that service is
   * absent (headless profile) or refuses the agent. Every caller hands the
   * resolved string to `storeFor`, which accepts nothing else.
   */
  private async resolveRoot(exec?: ToolRunContext): Promise<string> {
    if (exec !== undefined && exec !== null && exec.agent !== undefined) {
      try {
        const get = (this.ctx as unknown as { get?: (name: string) => unknown }).get
        const dirs = typeof get === 'function'
          ? (get.call(this.ctx, 'workingDirectory') as { ensure?: (agent: unknown, signal?: unknown) => Promise<string | undefined> } | undefined)
          : undefined
        if (dirs !== undefined && dirs !== null && typeof dirs.ensure === 'function') {
          const cwd = await dirs.ensure(exec.agent, exec.signal)
          if (typeof cwd === 'string' && cwd !== '') return cwd
        }
      } catch {
        /* fail-open: fall back to the process cwd */
      }
    }
    return process.cwd()
  }

  private toolSpec(
    name: string,
    description: string,
    body: (args: Record<string, unknown>, exec: ToolRunContext) => unknown,
    parameters: Record<string, unknown> = {},
  ): ToolDefinition {
    return {
      name,
      description,
      parameters,
      output: {
        schema: envelopeSchema(),
        render(_args, value) {
          const text: ContentBlock = typeof value === 'string'
            ? { type: 'text', text: value as string }
            : { type: 'text', text: JSON.stringify(value, null, 2) }
          return [text]
        },
      },
      isConcurrencySafe: () => name === 'gf_status' || name === 'gf_skills',
      async execute(args, exec) {
        return body((args ?? {}) as Record<string, unknown>, exec)
      },
    }
  }

  // --------------------------------------------------------------- hooks

  private wireHooks(): void {
    const on = (e: string, l: unknown) => (this.ctx as unknown as { on: (e: string, l: unknown) => void }).on(e, l)
    // agent/pre-step — waterfall; must call next() to admit the step. The
    // payload carries the step's `agent`, so the root resolves from the session
    // instead of from the host process cwd.
    on('agent/pre-step', async (payload: unknown, next: () => Promise<unknown>) => {
      try {
        await this.applyContextSummary(payload as ToolRunContext)
      } catch {
        /* fail-open: a helper error must not veto the step */
      }
      return next()
    })

    // tools/execute — around-dispatch; advance mutation generation after the
    // body settles (success OR failure; a failed write is still a mutation).
    on('tools/execute', async (exec: unknown, next: () => Promise<unknown>) => {
      let result: unknown
      try {
        result = await next()
      } finally {
        try {
          await this.noteMutation(exec as ToolRunContext)
        } catch {
          /* fail-open */
        }
      }
      return result
    })

    // tools/result — emit; record command success/failure for the fail-streak.
    // An emit listener cannot hand a promise to the emitter, so the async
    // bookkeeping is fire-and-forget and swallows its own failure.
    on('tools/result', (exec: unknown, result: unknown) => {
      void this.noteResult(exec as ToolRunContext, result).catch(() => {
        /* fail-open */
      })
    })

    // session/event — privacy-minimal metadata journal.
    on('session/event', () => {
      try {
        this.journal()
      } catch {
        /* fail-open */
      }
    })
  }

  private async applyContextSummary(exec?: ToolRunContext): Promise<void> {
    const store = openStateStore(await this.resolveRoot(exec))
    if (!store.hasProject) return
    const state = store.loadSync()
    if (state === null) return
    const debt = Math.max(0, state.mutationGeneration - state.verifiedGeneration)
    const summary =
      `[mulqi-getfable] phase=${state.phase} failStreak=${state.failStreak}/2 ` +
      `mutationDebt=${debt} activeCard=${state.activeCard ?? 'none'}`
    this.ctx.logger?.('gf')?.info?.(`[mulqi-getfable] ${summary}`)
  }

  private async noteMutation(exec?: ToolRunContext): Promise<void> {
    const name = String((exec as unknown as { name?: unknown })?.name ?? '')
    if (!MUTATING_TOOLS.has(normalizeToolName(name))) return
    const store = openStateStore(await this.resolveRoot(exec))
    if (!store.hasProject) return
    const state = store.loadSync()
    if (state === null) return
    store.saveSync({
      ...state,
      mutationGeneration: state.mutationGeneration + 1,
      updatedAt: new Date().toISOString(),
    })
  }

  private async noteResult(exec: ToolRunContext | undefined, result: unknown): Promise<void> {
    const name = String((exec as unknown as { name?: unknown })?.name ?? '').toLowerCase()
    if (name !== 'bash' && name !== 'shell') return
    const raw = result as { is_error?: boolean; isError?: boolean; output?: unknown }
    const isError =
      raw?.is_error === true ||
      raw?.isError === true ||
      (typeof raw?.output === 'string' && /\bexit\s*code\s*[:=]?\s*[1-9]\d*/i.test(raw.output))
    const store = openStateStore(await this.resolveRoot(exec))
    if (!store.hasProject) return
    const state = store.loadSync()
    if (state === null) return
    const failStreak = isError ? state.failStreak + 1 : 0
    store.saveSync({
      ...state,
      failStreak,
      phase: failStreak >= RECOVERY_THRESHOLD ? 'recovering' : state.phase,
      updatedAt: new Date().toISOString(),
    })
  }

  private journal(): void {
    this.ctx.logger?.('gf')?.debug?.(`gf journal t=${Date.now()}`)
  }

  // --------------------------------------------------------------- skills

  private wireSkillProvider(): void {
    const skills = (this.ctx as unknown as { skills: GfSkillRegistry }).skills
    skills.registerProvider(() => ({
      name: 'mulqi-getfable',
      async list() {
        return GfSkillRegistry.map((entry) => ({
          name: entry.id,
          description: entry.description,
          whenToUse: entry.description,
          rank: 600,
          locator: entry.id,
          source: 'bundled' as const,
          provider: 'mulqi-getfable',
          invocation: { modelInvocable: true, userInvocable: true },
        }))
      },
      async get(candidate: unknown, _options?: unknown) {
        const locator = (candidate as { locator?: unknown })?.locator
        if (typeof locator !== 'string') return undefined
        const entry = GfSkillRegistry.find((s) => s.id === locator)
        if (entry === undefined) return undefined
        return {
          name: entry.id,
          description: entry.description,
          whenToUse: entry.description,
          content: renderSkillBody(entry),
          source: 'bundled' as const,
          provider: 'mulqi-getfable',
          invocation: { modelInvocable: true, userInvocable: true },
          resourceBase: {
            kind: 'opaque' as const,
            description: `mulqi-getfable bundled skill ${entry.id}. No external companion references are bundled.`,
          },
        }
      },
    }))
  }

  // --------------------------------------------------------------- rpc

  /** Endpoint dispatcher used by `src/host/index.ts` for a channel kind. */
  endpointDispatcher(kind: 'read' | 'write'): (channel: string, endpoint: string, payload: unknown) => Promise<GfResult<unknown>> {
    return async (_channel, endpoint, payload) => {
      if (kind === 'read') return this.readEndpoint(endpoint, payload as Record<string, unknown>)
      return this.writeEndpoint(endpoint, payload as Record<string, unknown>)
    }
  }

  private async readEndpoint(
    endpoint: string,
    _payload: Record<string, unknown>,
  ): Promise<GfResult<unknown>> {
    switch (endpoint) {
      case 'ping':
        return ok(ping())
      case 'status':
        return ok(this.status())
      case 'plan':
        return ok(this.plan())
      case 'skills':
        return ok(this.skillInfos())
      case 'doctor':
        return ok(this.doctor(false))
      default:
        return fail('unknown-endpoint', `no read endpoint named "${endpoint}"`)
    }
  }

  private async writeEndpoint(
    endpoint: string,
    payload: Record<string, unknown>,
  ): Promise<GfResult<unknown>> {
    switch (endpoint) {
      case 'route': {
        const req = payload as unknown as GfRouteRequest
        if (typeof req?.task !== 'string') return fail('bad-request', 'route requires a string task')
        return ok(this.routeResponse(req))
      }
      case 'doctor': {
        const req = payload as { fix?: boolean }
        return ok(this.doctor(req?.fix === true))
      }
      default:
        return fail('unknown-endpoint', `no write endpoint named "${endpoint}"`)
    }
  }

  // --------------------------------------------------------------- queries

  /**
   * Open the state store at an already-resolved project root.
   *
   * Takes a root string only -- never a ToolRunContext. Accepting the exec here
   * is exactly how an unresolved context used to fall through to process.cwd()
   * and read the wrong project.
   */
  private storeFor(root?: string): ReturnType<typeof openStateStore> {
    return openStateStore(root ?? process.cwd())
  }

  private status(root?: string): GfStatusSnapshot {
    const { state } = this.serve(root)
    const phase = state?.phase ?? 'idle'
    const failStreak = state?.failStreak ?? 0
    const mutationDebt = state === null ? 0 : Math.max(0, state.mutationGeneration - state.verifiedGeneration)
    const planProgress = planProgressPercent(state)
    const doctor = this.doctor(false, root).healthy
    return {
      version: PLUGIN_VERSION,
      phase,
      failStreak,
      recoveryThreshold: RECOVERY_THRESHOLD,
      mutationDebt,
      activeCard: state?.activeCard ?? null,
      planProgress,
      doctor,
      metrics: [
        {
          label: 'Active work card',
          value: state?.activeCard ?? 'none',
          tone: 'neutral',
          detail: mutationDebt > 0 ? `${mutationDebt} generation(s) unverified` : 'no unverified debt',
        },
        {
          label: 'Planning phase progress',
          value: `${planProgress}%`,
          tone: planProgress >= 100 ? 'ok' : 'neutral',
        },
        {
          label: 'Failure streak',
          value: `${failStreak}/${RECOVERY_THRESHOLD}`,
          tone: failStreak >= RECOVERY_THRESHOLD ? 'danger' : failStreak === 1 ? 'warn' : 'ok',
          detail: failStreak >= RECOVERY_THRESHOLD ? 'recovery triggered' : 'below recovery threshold',
        },
        {
          label: 'Available skills',
          value: String(GfSkillRegistry.length),
          tone: 'neutral',
          detail: 'bundled lifecycle skills',
        },
      ],
    }
  }

  private plan(root?: string): GfPlanSnapshot {
    const { state } = this.serve(root)
    const cards = state?.cards ?? []
    const phases = cards.map((card, i) => ({
      id: card.id !== '' ? card.id : `card-${i}`,
      title: card.title,
      status: card.status,
      progress: card.status === 'checked' ? 100 : 0,
    }))
    const total = cards.length
    const done = cards.filter((c) => c.status === 'checked').length
    return {
      attestation: state?.attestationSha ?? null,
      phases,
      progressPercent: total === 0 ? 0 : Math.round((done / total) * 100),
    }
  }

  private skillInfos(): GfSkillInfo[] {
    return GfSkillRegistry.map((entry) => ({
      id: entry.id,
      name: entry.id,
      description: entry.description,
      state: 'loaded' as const,
    }))
  }

  private doctor(fix: boolean, root?: string): GfDoctorReport {
    const store = this.storeFor(root)
    let ledgerText: string | undefined
    try {
      const candidate = `${store.fableDir}/task_plan.md`
      const atRoot = `${store.fableDir.slice(0, -'.fable'.length)}/task_plan.md`
      const path = existsSync(candidate) ? candidate : atRoot
      if (existsSync(path)) ledgerText = readFileSync(path, 'utf8')
    } catch {
      ledgerText = undefined
    }
    return runDoctor({ store, ledgerText, fix })
  }

  private routeResponse(req: GfRouteRequest, root?: string): GfRouteResponse {
    const { state } = this.serve(root)
    const decision = route({ task: req.task, state })
    if (req.apply === true) {
      const store = this.storeFor(root)
      if (store.hasProject) {
        const base = state ?? emptyState()
        const next: FableState = {
          ...base,
          phase: decision.phase,
          activeCard: base.activeCard ?? decision.skill,
          updatedAt: new Date().toISOString(),
        }
        store.saveSync(next)
      }
      return {
        decision: decision.skill,
        phase: decision.phase,
        reason: decision.reason,
        evidence: decision.evidence,
        applied: true,
      }
    }
    const preview = routePreview({ task: req.task, state })
    return {
      decision: preview.skill,
      phase: preview.phase,
      reason: preview.reason,
      evidence: preview.evidence,
      applied: false,
    }
  }

  /** Load-or-default for the current project root. */
  private serve(root?: string): { store: ReturnType<typeof openStateStore>; state: FableState | null } {
    const store = this.storeFor(root)
    return { store, state: store.loadSync() }
  }
}

// ---------------------------------------------------------------- helpers

function planProgressPercent(state: FableState | null): number {
  if (state === null || state.cards.length === 0) return 0
  const done = state.cards.filter((c) => c.status === 'checked').length
  return Math.round((done / state.cards.length) * 100)
}

function ok<T>(value: T): GfResult<T> {
  return { ok: true, value }
}

function fail(code: string, message: string): GfResult<never> {
  return { ok: false, error: { code, message } }
}

function ping(): GfPing {
  return { pong: true, plugin: 'mulqi-getfable', version: PLUGIN_VERSION }
}

function envelopeSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      ok: { type: 'boolean' },
      value: {},
      error: {
        type: 'object',
        properties: { code: { type: 'string' }, message: { type: 'string' } },
      },
    },
  }
}

function routeParams(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      task: { type: 'string', description: 'The task or intent to route.' },
      apply: { type: 'boolean', description: 'Persist the decision into the durable .fable state.', default: false },
    },
    required: ['task'],
  }
}

function doctorParams(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      fix: { type: 'boolean', description: 'Run one bounded, idempotent repair.', default: false },
    },
  }
}

function normalizeToolName(value: string): string {
  return value.toLowerCase().replace(/[-_]/g, '')
}

const MUTATING_TOOLS = new Set<string>(
  ['edit', 'write', 'multiedit', 'notebookedit', 'apply-patch', 'write-file',
   'write-to-file', 'replace', 'replace-file-content', 'multi-replace-file-content',
   'create-file', 'delete-file', 'move-file', 'rename-file'].map(normalizeToolName),
)


export const RECOVERY_THRESHOLD = 2
export type { RouteDecision, GfSkillEntry }
