/**
 * Doctor: bounded diagnostics over the .fable project state.
 *
 * Read-only by default (`fix: false`); with `fix: true` it performs one
 * bounded, idempotent repair (rebuild a malformed or missing state.json from
 * the ledger, clamped) and reports what it did. Mirrors the upstream
 * doctor semantics: { fixed, repaired, repairErrors } plus a per-check list.
 */
import { emptyState, RECOVERY_THRESHOLD, type FableState, type StateStore } from './state.ts'
import { lintLedger } from './ledger.ts'
import type { GfDoctorCheck, GfDoctorReport } from './wire.ts'

export interface DoctorInput {
  readonly store: StateStore
  readonly ledgerText?: string
  readonly fix?: boolean
}

export function runDoctor(input: DoctorInput): GfDoctorReport {
  const { store, ledgerText, fix = false } = input
  const checks: GfDoctorCheck[] = []
  const repairErrors: string[] = []
  let repaired = 0
  let fixed = 0

  // 1. Project opt-in: is there a .fable directory at all?
  const hasProject = store.hasProject
  checks.push({
    id: 'opt-in',
    label: '.fable/ project opt-in',
    pass: hasProject,
    detail: hasProject
      ? `found ${store.fableDir}`
      : 'no .fable/ directory — project is not opted in; enforcement is a no-op',
  })

  // 2. State schema: does state.json parse to a valid v3 state?
  const loaded = store.loadSync()
  let state: FableState | null = loaded
  if ((hasProject || fix) && state === null) {
    const pass = false
    checks.push({
      id: 'state-schema',
      label: 'state.json schema v3',
      pass,
      detail: 'state.json is missing or malformed',
    })
    if (fix) {
      try {
        state = emptyState()
        if (ledgerText !== undefined) {
          const parsed = lintLedger('task_plan.md', ledgerText)
          state = { ...state, failStreak: Math.min(parsed.open === 0 ? RECOVERY_THRESHOLD : state.failStreak, RECOVERY_THRESHOLD) }
        }
        store.saveSync(state)
        repaired += 1
      } catch (err) {
        repairErrors.push(`state rebuild: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  } else {
    const valid = state !== null
    const detail = state !== null ? `phase ${state.phase}, v${state.schemaVersion}` : 'no project state'
    checks.push({
      id: 'state-schema',
      label: 'state.json schema v3',
      pass: valid,
      detail,
    })
  }

  // 3. Generation debt: unverified mutation debt present?
  if (state !== null) {
    const debt = state.mutationGeneration - state.verifiedGeneration
    checks.push({
      id: 'generation-debt',
      label: 'unverified mutation debt',
      pass: debt <= 0,
      detail: debt > 0 ? `${debt} generation(s) mutated without a fresh verification` : 'no debt',
    })
  }

  // 4. Fail streak: is the workflow stuck in a failure loop?
  if (state !== null) {
    const stuck = state.failStreak >= RECOVERY_THRESHOLD
    checks.push({
      id: 'fail-streak',
      label: 'failure streak',
      pass: !stuck,
      detail: stuck
        ? `failStreak ${state.failStreak} ≥ ${RECOVERY_THRESHOLD} — workflow is in recovery; change the diagnosis before another edit`
        : `failStreak ${state.failStreak}`,
    })
  }

  // 5. Ledger discipline: open/checked/deferred cards carry the required markers.
  if (ledgerText !== undefined) {
    const parsed = lintLedger('task_plan.md', ledgerText)
    const clean = parsed.findings.length === 0
    checks.push({
      id: 'ledger-lint',
      label: 'ledger discipline',
      pass: clean,
      detail: clean
        ? `${parsed.open} open, ${parsed.checked} checked, ${parsed.deferred} deferred — all carry their markers`
        : `${parsed.findings.length} finding(s): ${parsed.findings.map((f) => f.rule).join(', ')}`,
    })
    if (fix && !clean) {
      // Bounded repair: there is nothing to auto-fix in a ledger without
      // inventing evidence; report it as a repairError so the operator sees
      // exactly which cards need attention.
      for (const finding of parsed.findings) {
        repairErrors.push(`ledger ${finding.file}:${finding.detail}`)
      }
    }
  }

  if (fix && hasProject && state !== null && state.failStreak > RECOVERY_THRESHOLD) {
    // Clamp an over-threshold streak as the single bounded repair.
    const clamped: FableState = { ...state, failStreak: RECOVERY_THRESHOLD, updatedAt: new Date().toISOString() }
    try {
      store.saveSync(clamped)
      fixed += 1
    } catch (err) {
      repairErrors.push(`clamp failStreak: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const healthy = checks.every((c) => c.pass) && repairErrors.length === 0
  return { checks, fixed, repaired, repairErrors, healthy }
}
