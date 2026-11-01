/**
 * Shared wire types between host service and the browser client bundle.
 * These are re-declared on each side of the boundary as plain JSON shapes;
 * no runtime import crosses the boundary.
 */

/** Discriminated result envelope for every RPC endpoint. */
export type GfResult<T> = { ok: true; value: T } | { ok: false; error: GfError }

export interface GfError {
  readonly code: string
  readonly message: string
}

/** The two channel names (host-side literals; the client re-declares them). */
export const GF_READ_CHANNEL = '/mulqi-gf-read'
export const GF_WRITE_CHANNEL = '/mulqi-gf-write'

/** One metric tile in the Fable Hub. */
export interface GfMetric {
  readonly label: string
  readonly value: string
  readonly tone: 'ok' | 'warn' | 'danger' | 'neutral'
  readonly detail?: string
}

export interface GfPhaseItem {
  readonly id: string
  readonly title: string
  readonly status: 'open' | 'checked' | 'deferred'
  readonly progress: number
}

export interface GfPlanSnapshot {
  readonly attestation: string | null
  readonly phases: readonly GfPhaseItem[]
  readonly progressPercent: number
}

export interface GfSkillInfo {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly state: 'loaded' | 'unavailable' | 'error'
  readonly detail?: string
}

export interface GfStatusSnapshot {
  readonly version: string
  readonly phase: string
  readonly failStreak: number
  readonly recoveryThreshold: number
  readonly mutationDebt: number
  readonly activeCard: string | null
  readonly planProgress: number
  readonly doctor: boolean
  readonly metrics: readonly GfMetric[]
}

export interface GfRouteRequest {
  readonly task: string
  readonly apply?: boolean
}

export interface GfRouteResponse {
  readonly decision: string
  readonly phase: string
  readonly reason: string
  readonly evidence: readonly string[]
  readonly applied: boolean
}

export interface GfDoctorReport {
  readonly checks: readonly GfDoctorCheck[]
  readonly fixed: number
  readonly repaired: number
  readonly repairErrors: readonly string[]
  readonly healthy: boolean
}

export interface GfDoctorCheck {
  readonly id: string
  readonly label: string
  readonly pass: boolean
  readonly detail: string
}

export interface GfPing {
  readonly pong: boolean
  readonly plugin: string
  readonly version: string
}
