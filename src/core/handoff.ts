/**
 * Handoff document builder for mulqi-getfable.
 *
 * A handoff is the one artifact another session or agent reads when this one
 * stops. It must be self-contained: durable state, the active card, what
 * remains, the open findings, and an explicit re-verify list — no session id,
 * no URL, nothing that only exists in the writer's head.
 *
 * Pure and synchronous so it is unit-testable and so the tool can build a
 * document without touching durable state.
 */
import { lintLedger, type LedgerFinding } from './ledger.ts'
import { RECOVERY_THRESHOLD, type FableState } from './state.ts'

export interface HandoffInput {
  readonly projectRoot: string
  readonly version: string
  /** `false` when there is no `.fable/` directory — the honest opt-out case. */
  readonly hasProject: boolean
  readonly state: FableState | null
  /** Raw `task_plan.md` text, when the caller could read it. */
  readonly ledgerText?: string
}

export interface HandoffDocument {
  readonly markdown: string
  /** One line per item the next session must re-check before trusting state. */
  readonly reVerify: readonly string[]
}

function bullet(lines: readonly string[]): string {
  return lines.length === 0 ? '- (none)' : lines.join('\n')
}

export function buildHandoff(input: HandoffInput): HandoffDocument {
  const { projectRoot, version, hasProject, state, ledgerText } = input
  const reVerify: string[] = []
  const out: string[] = []

  out.push('# Fable handoff')
  out.push('')
  out.push(`- project: ${projectRoot}`)
  out.push(`- plugin: mulqi-getfable ${version}`)
  out.push(`- generatedAt: ${new Date().toISOString()}`)
  out.push('')

  if (!hasProject || state === null) {
    out.push('## Status')
    out.push('')
    out.push('- project is not opted in: no .fable/ directory and no durable state')
    out.push('- nothing to resume; the workflow is a no-op until the project opts in')
    out.push('')
    reVerify.push('confirm the project is opted in (create .fable/) before resuming')
    return { markdown: out.join('\n'), reVerify }
  }

  const debt = state.mutationGeneration - state.verifiedGeneration
  out.push('## Durable state')
  out.push('')
  out.push(`- phase: ${state.phase}`)
  out.push(`- failStreak: ${state.failStreak}/${RECOVERY_THRESHOLD}`)
  out.push(`- activeCard: ${state.activeCard ?? '(none)'}`)
  out.push(`- mutation debt: ${debt}`)
  out.push(`- updatedAt: ${state.updatedAt}`)
  out.push('')

  const openCards = state.cards.filter((c) => c.status === 'open')
  const checkedCards = state.cards.filter((c) => c.status === 'checked')
  const deferredCards = state.cards.filter((c) => c.status === 'deferred')

  out.push('## What remains')
  out.push('')
  out.push(
    bullet([
      ...openCards.map((c) => `- [ ] ${c.title}`),
      ...deferredCards.map(
        (c) =>
          `- [~] ${c.title}${c.deferredReason !== undefined ? ` (deferred: ${c.deferredReason})` : ''}`,
      ),
    ]),
  )
  out.push('')

  out.push('## Done')
  out.push('')
  out.push(
    bullet(
      checkedCards.map(
        (c) => `- [x] ${c.title}${c.evidence !== undefined ? ` — evidence: ${c.evidence}` : ''}`,
      ),
    ),
  )
  out.push('')

  const findings: LedgerFinding[] =
    ledgerText !== undefined ? [...lintLedger('task_plan.md', ledgerText).findings] : []
  out.push('## Open findings')
  out.push('')
  out.push(bullet(findings.map((f) => `- ${f.rule}: ${f.file} — ${f.detail}`)))
  out.push('')

  if (debt > 0) {
    reVerify.push(`${debt} generation(s) mutated after the last verification — run the acceptance check again`)
  }
  if (state.failStreak > 0) {
    reVerify.push(
      `failure streak is ${state.failStreak}/${RECOVERY_THRESHOLD} — prove the execution path before another edit`,
    )
  }
  if (state.activeCard !== null) {
    reVerify.push(`active card ${state.activeCard} is unverified — confirm its acceptance criteria`)
  }
  for (const finding of findings) {
    reVerify.push(`${finding.rule} at ${finding.file} — ${finding.detail}`)
  }
  if (reVerify.length === 0) {
    reVerify.push('no unverified debt — state is trustworthy as written')
  }

  out.push('## Re-verify before trusting')
  out.push('')
  out.push(bullet(reVerify.map((line) => `- ${line}`)))
  out.push('')

  return { markdown: out.join('\n'), reVerify }
}
