/**
 * Browser half of mulqi-getfable — the client entry.
 *
 * `apply(rawContext)` runs inside the host's client-module loader
 * (`lib/client.js` is a `window.__ModuleLoader__.load({id, factory})`
 * bundle). It contributes two slot cells and nothing else:
 *
 *   conversation.view  id 'mulqi-getfable' order 12 → the Fable Hub panel
 *   settings.section   id 'mulqi-getfable' order 40 → the self-test card
 *
 * Hard rules this entry exists to honour:
 *   - P4: `apply` NEVER throws. `slots.register` THROWS on an undeclared slot
 *     and on an equal-priority collision in an occupied cell, so every call
 *     is guarded and a refusal is recorded instead of reaching the page. A
 *     dead panel must not cost the operator their conversation.
 *   - Purity: the only runtime import is `react` (a declared shared external);
 *     everything else is `import type`, so the bundle stays self-contained.
 *   - Every untrusted value flows through `text()` / `textSpan()` in
 *     `text.ts` — a ledger entry containing `<script>` renders as text.
 *   - All host traffic goes through `/mulqi-gf-read` + `/mulqi-gf-write` on
 *     `ctx.connection.rpc.call`. No HTTP route of our own, no token, no
 *     browser-side read of `.fable/`.
 *   - An RPC failure is a rendered state, never a crash.
 */
import { createElement as h, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// ---- wire contract (re-declared; no runtime import across the boundary) ----

const READ = '/mulqi-gf-read'
const WRITE = '/mulqi-gf-write'

interface GfError {
  code: string
  message: string
}
type GfResult<T> = { ok: true; value: T } | { ok: false; error: GfError }

interface GfMetric {
  label: string
  value: string
  tone: 'ok' | 'warn' | 'danger' | 'neutral'
  detail?: string
}
interface GfPhaseItem {
  id: string
  title: string
  status: 'open' | 'checked' | 'deferred'
  progress: number
}
interface GfPlanSnapshot {
  attestation: string | null
  phases: readonly GfPhaseItem[]
  progressPercent: number
}
interface GfSkillInfo {
  id: string
  name: string
  description: string
  state: 'loaded' | 'unavailable' | 'error'
  detail?: string
}
interface GfStatusSnapshot {
  version: string
  phase: string
  failStreak: number
  recoveryThreshold: number
  mutationDebt: number
  activeCard: string | null
  planProgress: number
  doctor: boolean
  metrics: readonly GfMetric[]
}
interface GfPing {
  pong: boolean
  plugin: string
  version: string
}
type GfDoctorCheck = {
  id: string
  label: string
  pass: boolean
  detail: string
}
type GfDoctorReport = {
  checks: readonly GfDoctorCheck[]
  fixed: number
  repaired: number
  repairErrors: readonly string[]
  healthy: boolean
}
type GfRouteResponse = {
  decision: string
  phase: string
  reason: string
  evidence: readonly string[]
  applied: boolean
}

type RpcCall = (
  channel: string,
  endpoint: string,
  payload?: unknown,
  signal?: AbortSignal,
) => Promise<unknown>

const PING_FALLBACK: GfPing = { pong: false, plugin: 'mulqi-getfable', version: '?' }

function unwrap<T>(raw: unknown, fallback: T): { value: T; error: GfError | null } {
  if (raw !== null && typeof raw === 'object' && 'ok' in raw) {
    const res = raw as GfResult<unknown>
    if (res.ok === true) return { value: (res.value ?? fallback) as T, error: null }
    return { value: fallback, error: { code: res.error?.code ?? 'rpc', message: res.error?.message ?? String(raw) } }
  }
  return { value: raw as T, error: null }
}

// ---- slots face (declared on the host via declaration merging) -----------

interface SlotsFace {
  register(options: Record<string, unknown>, component: unknown): unknown
  inject(slot: string, build: () => unknown): unknown
}
interface ClientContext {
  readonly slots?: SlotsFace
  readonly connection?: { rpc?: { call: RpcCall } }
  readonly sessions?: { getSnapshot?: () => unknown }
  readonly effect?: (execute: () => unknown, label?: string) => unknown
}

const PANEL_ID = 'mulqi-getfable'
const PANEL_ORDER = 12
const SETTINGS_ID = 'mulqi-getfable'
const SETTINGS_ORDER = 40

// ---- text helpers (untrusted-safe) ---------------------------------------

function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  return String(value)
}
function textSpan(value: unknown): ReactNode {
  return text(value)
}

// ---- styling tokens (inline; the bundle ships no stylesheet) -------------

const S = {
  root: { display: 'flex', flexDirection: 'column', gap: 10, padding: 12, fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: 13, color: '#d8dbe0' } as const,
  tabs: { display: 'flex', gap: 4 } as const,
  tab: { padding: '3px 10px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#d8dbe0' } as const,
  tabOn: { borderColor: '#7aa2ff', background: 'rgba(122,162,255,0.14)' } as const,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 } as const,
  tile: { border: '1px solid rgba(127,127,127,0.28)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 } as const,
  tileValue: { fontSize: 18, fontWeight: 600 } as const,
  tileDetail: { fontSize: 11, opacity: 0.65 } as const,
  muted: { opacity: 0.65, fontSize: 12 } as const,
  badge: { fontSize: 11, padding: '1px 6px', borderRadius: 999, border: '1px solid rgba(127,127,127,0.4)' } as const,
  sectionTitle: { fontSize: 12, letterSpacing: 0.04, textTransform: 'uppercase', opacity: 0.7 } as const,
  row: { display: 'flex', gap: 8, alignItems: 'baseline', padding: '4px 0', borderBottom: '1px solid rgba(127,127,127,0.14)' } as const,
  input: { width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.4)', background: 'rgba(0,0,0,0.2)', color: '#d8dbe0', fontSize: 13 } as const,
  button: { padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.4)', background: 'rgba(127,127,127,0.12)', cursor: 'pointer', fontSize: 12, color: '#d8dbe0' } as const,
  error: { border: '1px solid rgba(200,90,60,0.5)', borderRadius: 8, padding: '8px 10px', color: '#ff9d8a', fontSize: 12, background: 'rgba(200,90,60,0.1)' } as const,
  mono: { fontFamily: 'ui-monospace, monospace', fontSize: 11 } as const,
} as const

const TONE: Record<string, Record<string, string>> = {
  ok: { color: '#8fe0b0', background: 'rgba(80,180,120,0.14)', borderColor: 'rgba(80,180,120,0.5)' },
  warn: { color: '#f2c777', background: 'rgba(210,160,60,0.16)', borderColor: 'rgba(210,160,60,0.55)' },
  danger: { color: '#ff9d8a', background: 'rgba(200,90,60,0.18)', borderColor: 'rgba(200,90,60,0.65)' },
  neutral: { color: '#c3c9d1', borderColor: 'rgba(127,127,127,0.45)' },
}

function badge(value: unknown, tone?: string): ReactNode {
  const key = tone ?? 'neutral'
  return h('span', { style: { ...S.badge, ...TONE[key] }, className: `gf-badge gf-badge-${key}` }, textSpan(value))
}

// ---- load slot: idle/loading/error(retry)/ready --------------------------

type Load<T> =
  | { kind: 'idle'; value?: T }
  | { kind: 'loading'; value?: T }
  | { kind: 'error'; error: GfError; value?: T }
  | { kind: 'ready'; value: T }

function loadView<T>(load: Load<T>, render: (value: T) => ReactNode, retry: () => void, what: string): ReactNode {
  if (load.kind === 'idle') return h('div', { style: S.muted }, `${what}: not loaded yet`)
  if (load.kind === 'loading') return h('div', { style: S.muted }, `${what}: loading…`)
  if (load.kind === 'error') {
    return h(
      'div',
      { style: S.error, role: 'alert' },
      h('span', null, `${what} failed — ${load.error.code}: ${load.error.message}`),
      ' ',
      h('button', { style: S.button, onClick: retry }, 'retry'),
      load.value === undefined ? null : h('div', { style: { marginTop: 6 } }, render(load.value)),
    )
  }
  return render(load.value)
}

// ---- tabs ----------------------------------------------------------------

type TabId = 'hub' | 'plan' | 'skills' | 'route' | 'doctor'
const TABS: readonly TabId[] = ['hub', 'plan', 'skills', 'route', 'doctor']

// ============================================================================

interface PanelModel {
  rpc: RpcCall | null
  status: Load<GfStatusSnapshot>
  plan: Load<GfPlanSnapshot>
  skills: Load<readonly GfSkillInfo[]>
  doctor: Load<GfDoctorReport>
  route: Load<GfRouteResponse>
  refreshAll(): void
  runRoute(task: string, apply: boolean): void
  runDoctor(fix: boolean): void
}

class GfPanelModel implements PanelModel {
  readonly rpc: RpcCall | null
  private _status: Load<GfStatusSnapshot> = { kind: 'idle' }
  private _plan: Load<GfPlanSnapshot> = { kind: 'idle' }
  private _skills: Load<readonly GfSkillInfo[]> = { kind: 'idle' }
  private _doctor: Load<GfDoctorReport> = { kind: 'idle' }
  private _route: Load<GfRouteResponse> = { kind: 'idle' }
  private readonly scope: Record<string, unknown>

  constructor(rpc: RpcCall | null, sessionId?: string) {
    this.rpc = rpc
    this.scope = sessionId !== undefined && sessionId !== '' ? { sessionId } : {}
  }

  get status() { return this._status }
  get plan() { return this._plan }
  get skills() { return this._skills }
  get doctor() { return this._doctor }
  get route() { return this._route }

  private async read<T>(endpoint: string, prev: Load<T>): Promise<Load<T>> {
    if (this.rpc === null) {
      return { kind: 'error', error: { code: 'no-connection', message: 'client connection unavailable' }, value: prev.value }
    }
    try {
      const raw = await this.rpc(READ, endpoint, {})
      const { value, error } = unwrap<T>(raw, prev.value as T)
      return error === null ? { kind: 'ready', value: value as T } : { kind: 'error', error, value: prev.value }
    } catch (err) {
      return { kind: 'error', error: { code: 'rpc-transport', message: err instanceof Error ? err.message : String(err) }, value: prev.value }
    }
  }

  private async write<T>(endpoint: string, payload: Record<string, unknown>, prev: Load<T>): Promise<Load<T>> {
    if (this.rpc === null) {
      return { kind: 'error', error: { code: 'no-connection', message: 'client connection unavailable' }, value: prev.value }
    }
    try {
      const raw = await this.rpc(WRITE, endpoint, { ...this.scope, ...payload })
      const { value, error } = unwrap<T>(raw, prev.value as T)
      return error === null ? { kind: 'ready', value: value as T } : { kind: 'error', error, value: prev.value }
    } catch (err) {
      return { kind: 'error', error: { code: 'rpc-transport', message: String(err) }, value: prev.value }
    }
  }

  refreshAll(): void {
    this._status = { kind: 'loading', value: this._status.value }
    this._plan = { kind: 'loading', value: this._plan.value }
    this._skills = { kind: 'loading', value: this._skills.value }
    this._doctor = { kind: 'loading', value: this._doctor.value }
    void this.read<GfStatusSnapshot>('status', this._status).then((v) => (this._status = v))
    void this.read<GfPlanSnapshot>('plan', this._plan).then((v) => (this._plan = v))
    void this.read<readonly GfSkillInfo[]>('skills', this._skills).then((v) => (this._skills = v))
    void this.read<GfDoctorReport>('doctor', this._doctor).then((v) => (this._doctor = v))
  }

  runRoute(task: string, apply: boolean): void {
    this._route = { kind: 'loading', value: this._route.value }
    void this.write<GfRouteResponse>('route', { task, apply }, this._route).then((v) => (this._route = v))
  }

  runDoctor(fix: boolean): void {
    this._doctor = { kind: 'loading', value: this._doctor.value }
    void this.write<GfDoctorReport>('doctor', { fix }, this._doctor).then((v) => (this._doctor = v))
  }
}

function createModel(rpc: RpcCall | null, sessionId?: string): PanelModel {
  return new GfPanelModel(rpc, sessionId)
}

// ---- pure views (functions of a snapshot + model) ------------------------

function HubView(model: PanelModel): ReactNode {
  const status = model.status.value
  if (status === undefined) {
    return h('div', { style: S.muted }, 'hub: not loaded yet')
  }
  return h(
    'div',
    { style: S.grid },
    ...status.metrics.map((metric) =>
      h(
        'div',
        { key: metric.label, style: S.tile },
        h('div', { style: S.sectionTitle }, text(metric.label)),
        h('div', { style: S.tileValue }, text(metric.value)),
        metric.detail !== undefined ? h('div', { style: S.tileDetail }, text(metric.detail)) : null,
        badge(metric.tone, metric.tone),
      ),
    ),
  )
}

function PlanView(model: PanelModel): ReactNode {
  const plan = model.plan
  if (plan.kind !== 'ready') return h('div', { style: S.muted }, 'plan: not loaded yet')
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
    h('div', { style: S.row },
      h('span', { style: S.sectionTitle }, 'attestation'),
      plan.value.attestation !== null
        ? h('code', { style: S.mono }, text(plan.value.attestation.slice(0, 16)))
        : h('span', { style: S.muted }, 'none'),
    ),
    h('div', { style: S.row },
      h('span', { style: S.sectionTitle }, 'progress'),
      h('span', { style: S.mono }, `${plan.value.progressPercent}%`),
    ),
    ...plan.value.phases.map((phase) =>
      h('div', { key: phase.id, style: S.row },
        badge(phase.status, phase.status === 'checked' ? 'ok' : phase.status === 'deferred' ? 'warn' : 'neutral'),
        h('span', null, text(phase.title)),
      )),
  )
}

function SkillsView(model: PanelModel): ReactNode {
  const load = model.skills
  if (load.kind !== 'ready') {
    return loadView(load, (skills) => h('div', null, 'skills'), () => undefined, 'skills')
  }
  return h('div', null,
    ...load.value.map((skill) =>
      h('div', { key: skill.id, style: S.row },
        badge(skill.state, skill.state === 'loaded' ? 'ok' : skill.state === 'error' ? 'danger' : 'warn'),
        h('span', { style: S.mono }, text(skill.id)),
      )),
  )
}

function RouterView(model: PanelModel): ReactNode {
  const [task, setTask] = useState('')
  const [applied, setApplied] = useState<readonly string[]>([])
  const load = model.route
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
    h('div', { style: { display: 'flex', gap: 6 } },
      h('input', {
        style: S.input,
        value: task,
        placeholder: 'describe the task to route…',
        onChange: (e: { target: { value: string } }) => setTask(e.target.value),
      }),
      h('button', { style: S.button, onClick: () => model.runRoute(task, false), disabled: task.trim() === '' }, 'preview'),
      h('button', { style: { ...S.button, borderColor: 'rgba(122,162,255,0.6)' }, onClick: () => model.runRoute(task, true), disabled: task.trim() === '' }, 'apply'),
    ),
    loadView(load, (r) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        h('div', null,
          h('span', { style: S.mono }, text(r.decision)),
          ' → ',
          h('span', { style: S.mono }, text(r.phase)),
          r.applied ? ' (applied)' : ' (preview)'),
        h('div', { style: S.muted }, text(r.reason)),
        r.evidence.length > 0
          ? h('div', { style: S.tileDetail }, r.evidence.map(text).join(' · '))
          : null,
      ), () => model.runRoute(task, false), 'route'),
  )
}

function DoctorView(model: PanelModel): ReactNode {
  const load = model.doctor
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
    h('div', { style: { display: 'flex', gap: 6 } },
      h('button', { style: S.button, onClick: () => model.runDoctor(false) }, 'diagnose'),
      h('button', { style: S.button, onClick: () => model.runDoctor(true) }, 'diagnose + repair'),
    ),
    loadView(load, (report) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        h('div', null,
          badge(report.healthy ? 'healthy' : 'needs attention', report.healthy ? 'ok' : 'warn'),
          ` fixed ${report.fixed} · repaired ${report.repaired}`),
        ...report.checks.map((check) =>
          h('div', { key: check.id, style: S.row },
            badge(check.pass ? 'pass' : 'fail', check.pass ? 'ok' : 'danger'),
            h('span', null, text(check.label)),
            h('span', { style: S.muted }, text(check.detail)),
          )),
        report.repairErrors.length > 0
          ? h('div', { style: S.muted }, report.repairErrors.map(text).join(' · '))
          : null,
      ), () => model.runDoctor(false), 'doctor'),
  )
}

// ---- settings card --------------------------------------------------------

interface SettingsProbe {
  ping: GfResult<GfPing> | null
  probedAt: number
}

function probe(api: { rpc: RpcCall | null }): Promise<SettingsProbe> {
  return new Promise((resolve) => {
    if (api.rpc === null) {
      resolve({ ping: { ok: false, error: { code: 'no-connection', message: 'client connection unavailable' } }, probedAt: Date.now() })
      return
    }
    api.rpc(READ, 'ping', {})
      .then((raw) => {
        const { value, error } = unwrap<GfPing>(raw, PING_FALLBACK)
        const result: GfResult<GfPing> = error === null
          ? { ok: true, value: (value as GfPing) ?? { pong: false, plugin: 'mulqi-getfable', version: '?' } }
          : { ok: false, error }
        resolve({ ping: result, probedAt: Date.now() })
      })
      .catch((err) => resolve({ ping: { ok: false, error: { code: 'rpc-transport', message: String(err) } }, probedAt: Date.now() }))
  })
}

function SettingsCard({ rpc }: { rpc: RpcCall | null }): ReactNode {
  const [probeState, setProbeState] = useState<SettingsProbe>({ ping: null, probedAt: 0 })
  const [running, setRunning] = useState(false)
  const selfTest = useCallback(async () => {
    setRunning(true)
    try {
      const result = await probe({ rpc })
      setProbeState(result)
    } finally {
      setRunning(false)
    }
  }, [rpc])

  useEffect(() => {
    if (probeState.ping === null) void selfTest()
  }, [probeState, selfTest])

  return h('div', { style: { ...S.root, background: 'transparent' } },
    h('div', { style: S.sectionTitle }, 'mulqi-getfable · self-test'),
    h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
      h('button', { style: S.button, onClick: selfTest, disabled: running }, running ? 'probing…' : 'probe host'),
      probeState.ping?.ok === true
        ? badge(`v${probeState.ping.value?.version ?? '?'}`, 'ok')
        : badge(probeState.ping?.ok === false ? probeState.ping.error.code : 'unprobed', 'warn'),
    ),
  )
}

// ---- conversation-view panel ---------------------------------------------

function GfPanel({ rpc, sessionId }: { rpc: RpcCall | null; sessionId?: string }): ReactNode {
  const model = modelFor(rpc, sessionId)
  const [tab, setTab] = useState<TabId>('hub')
  useEffect(() => {
    model.refreshAll()
  }, [model])
  return h('div', { style: S.root },
    h('div', { style: S.tabs },
      ...TABS.map((t) =>
        h('button', {
          key: t,
          style: { ...S.tab, ...(tab === t ? S.tabOn : {}) },
          onClick: () => setTab(t),
        }, t),
      )),
    h('div', null,
      tab === 'hub' ? HubView(model) : null,
      tab === 'plan' ? PlanView(model) : null,
      tab === 'skills' ? SkillsView(model) : null,
      tab === 'route' ? RouterView(model) : null,
      tab === 'doctor' ? DoctorView(model) : null,
    ),
  )
}

// A tiny model cache so switching tabs doesn't rebuild RPC state.
const MODEL_CACHE = new Map<string, PanelModel>()

function modelFor(rpc: RpcCall | null, sessionId?: string): PanelModel {
  const key = `${sessionId ?? 'default'}`
  const existing = MODEL_CACHE.get(key)
  if (existing !== undefined) {
    if (existing.rpc !== rpc) {
      const rebuilt = createModel(rpc, sessionId)
      MODEL_CACHE.set(key, rebuilt)
      return rebuilt
    }
    return existing
  }
  const model = createModel(rpc, sessionId)
  MODEL_CACHE.set(key, model)
  return model
}

// ---- entry ----------------------------------------------------------------

const mountFailures: string[] = []

/** For tests only: forget recorded mount failures. */
export function resetGfMountFailures(): void {
  mountFailures.length = 0
}
export function gfMountFailures(): readonly string[] {
  return mountFailures
}

function register(ctx: ClientContext, slot: string, options: Record<string, unknown>, component: unknown): (() => void) | null {
  const slots = ctx.slots
  if (slots === undefined || typeof slots.register !== 'function') {
    mountFailures.push(`${slot}: the slots service exposes no register()`)
    return null
  }
  try {
    const disposer = slots.register({ name: slot, ...options }, component)
    return typeof disposer === 'function' ? () => void (disposer as () => unknown)() : null
  } catch (error) {
    mountFailures.push(`${slot}: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function contribute(ctx: ClientContext, slot: string, build: () => (() => void) | null): void {
  const slots = ctx.slots
  if (slots === undefined || typeof slots.inject !== 'function') {
    mountFailures.push(`${slot}: the slots service exposes no inject()`)
    return
  }
  try {
    const disposer = slots.inject(slot, build)
    const cleanup = (disposer as (() => unknown) | undefined)
    if (typeof ctx.effect === 'function' && typeof cleanup === 'function') {
      const bound = cleanup.bind(null)
      ctx.effect(() => bound(), `mulqi-getfable: ${slot}`)
    }
  } catch (error) {
    mountFailures.push(`${slot}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function rpcOf(ctx: ClientContext): RpcCall | null {
  const rpc = ctx.connection?.rpc
  if (rpc === undefined || typeof rpc.call !== 'function') return null
  return rpc.call.bind(rpc)
}

/**
 * Plugin entry. The exported shape (name/inject/apply) is what the host's
 * client-module loader calls; nothing in here may throw (P4).
 */
export function apply(rawContext: unknown): void {
  try {
    const ctx = (rawContext !== null && typeof rawContext === 'object' ? rawContext : {}) as ClientContext
    const rpc = rpcOf(ctx)

    contribute(ctx, 'settings.section', () =>
      register(ctx, 'settings.section', { id: SETTINGS_ID, order: SETTINGS_ORDER }, () => h(SettingsCard, { rpc })))

    contribute(ctx, 'conversation.view', () =>
      register(ctx, 'conversation.view', { id: PANEL_ID, order: PANEL_ORDER, label: () => 'mulqi-getfable' },
        () => {
          const snapshot = ctx.sessions?.getSnapshot?.()
          const sessionId = (snapshot as { active?: string } | undefined)?.active
          return h(GfPanel, { rpc, sessionId })
        }))
  } catch {
    /* P4: a dead panel must never reach the page */
  }
}

/** Cordis services this entry reads off the host context. */
export const inject = ['slots', 'connection', 'sessions']

export const name = 'mulqi-getfable'
