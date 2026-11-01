/**
 * Deterministic routing for mulqi-getfable.
 *
 * Evidence precedence (highest first): a repeated/contradictory failure
 * outranks execution and routes to recovery; a security keyword routes to
 * security even when the diff also needs a general review; current external
 * API/version uncertainty routes to research; repository-local uncertainty
 * routes to discovery; a testable behaviour change routes through TDD; an
 * accepted bounded card routes to execution; an independent diff review
 * routes to review.
 *
 * Pure and synchronous so it is unit-testable and so a tool can preview a
 * route without touching durable state.
 */
import type { FableState, Phase } from './state.ts'

export interface RouteContext {
  readonly task: string
  readonly state: FableState | null
}

export interface RouteDecision {
  readonly skill: string
  readonly phase: Phase
  readonly reason: string
  readonly evidence: readonly string[]
  readonly applies: boolean
}

const SECURITY_RE =
  /(vulnerab|threat|authz|authoriz|secret(s)?\b|credential|trust[- ]boundary|xss|csrf|ssrf|injection|cve|cvss|pen[- ]?test|exploit|malware|ransomware|crypto)/i
const RECOVERY_RE =
  /(repeated(?:ly)?\s+(?:fail|attempt)|contradict|fails?\s+again|broken\s+build|stale\s+(?:proof|cache|evidence)|flaky\s+(?:test|failure)|errors?\s+on\s+(?:retry|re-run)|two\s+(?:consecutive|failed)|failure\s+streak)/i
const RESEARCH_RE =
  /(external api|third[- ]party|upstream|library behaviour|version (compat|support)|npm|documentation|official docs|current (spec|api)|contract (change|update))/i
const DISCOVER_RE =
  /(repository|codebase|source tree|entry point|module map|how (is|are) (this|the)|trace|inspect|what (does|is) (the|this) (repo|project)|unknown (runtime|env))/i
const PLAN_RE =
  /(architectur|decompos|design|contract|schema|data model|api design|boundar(y|ies)|scaffold|blueprint|plan|spec)/i
const TDD_RE =
  /(bug|regression|fix|test|red[- ]green|testable|behaviour (change)|spec (gap|update))/i
const REVIEW_RE =
  /(review|diff|pull request|correctness|quality (check|gate)|lint|style|code (smell|review))/i
const DELEGATE_RE =
  /(independent (cards|subtask)|parallel|delegate|fan[- ]out|disjoint (scope|ownership)|multi[- ]worker)/i
const COMPLETE_RE =
  /(release|ship|distribut|publish|tag|deploy|distribution decision)/i
const HANDOFF_RE =
  /(resume|another session|another agent|handoff|hand[- ]off|continue (next|tomorrow)|pick (up|off))/i

function collectEvidence(task: string, state: FableState | null, matched: string): readonly string[] {
  const evidence: string[] = []
  if (matched) evidence.push(`task text: "${matched}"`)
  if (state !== null) {
    evidence.push(`phase: ${state.phase}`)
    if (state.failStreak > 0) evidence.push(`failStreak: ${state.failStreak}`)
    if (state.activeCard !== null) evidence.push(`activeCard: ${state.activeCard}`)
    const debt = state.mutationGeneration - state.verifiedGeneration
    if (debt > 0) evidence.push(`unverified mutation debt: ${debt}`)
  }
  return evidence
}

function decide(skill: string, phase: Phase, reason: string, task: string, state: FableState | null, matched: string): RouteDecision {
  return {
    skill,
    phase,
    reason,
    evidence: collectEvidence(task, state, matched),
    applies: true,
  }
}

export function route(ctx: RouteContext): RouteDecision {
  const { task, state } = ctx
  const norm = task.trim()

  // 1. Failure outranks execution: repeated / contradictory failures -> recover.
  if ((state !== null && state.failStreak >= 2) || RECOVERY_RE.test(norm)) {
    return decide(
      'fable-recover',
      'recovering',
      'Repeated or contradictory failure outranks execution; change the diagnosis before another code edit.',
      task,
      state,
      'failure',
    )
  }

  // 2. Security keyword outranks general review.
  if (SECURITY_RE.test(norm)) {
    return decide(
      'fable-security',
      'verifying',
      'Trust-boundary / vulnerability / secret work routes to security even when the diff also needs a general review.',
      task,
      state,
      'security',
    )
  }

  // 3. External fact / API uncertainty -> research.
  if (RESEARCH_RE.test(norm)) {
    return decide(
      'fable-research',
      'discovering',
      'Current external fact or API uncertainty resolves against primary sources before implementation.',
      task,
      state,
      'external',
    )
  }

  // 4. Repository / runtime facts unknown -> discovery.
  if (DISCOVER_RE.test(norm)) {
    return decide(
      'fable-discover',
      'discovering',
      'Repository / environment / runtime evidence is unknown; gather the smallest load-bearing set.',
      task,
      state,
      'repo',
    )
  }

  // 5. Genuinely independent bounded cards -> delegate.
  if (DELEGATE_RE.test(norm)) {
    return decide(
      'fable-delegate',
      'planned',
      'Independent bounded subtasks with disjoint ownership delegate to parallel workers.',
      task,
      state,
      'delegate',
    )
  }

  // 6. Architecture / decomposition / contract choice -> plan.
  if (PLAN_RE.test(norm)) {
    return decide(
      'fable-plan',
      'planned',
      'Architecture / decomposition / contract choice converts discovery evidence into bounded, testable cards.',
      task,
      state,
      'architecture',
    )
  }

  // 7. Testable behaviour change / bug -> TDD.
  if (TDD_RE.test(norm)) {
    return decide(
      'fable-tdd',
      'executing',
      'A testable behaviour change or bug drives a red-green-refactor cycle.',
      task,
      state,
      'testable',
    )
  }

  // 8. Independent diff correctness review -> review.
  if (REVIEW_RE.test(norm)) {
    return decide(
      'fable-review',
      'verifying',
      'Independent, evidence-grounded review of a git diff against spec and invariants.',
      task,
      state,
      'diff',
    )
  }

  // 9. Ready for distribution decision -> release.
  if (COMPLETE_RE.test(norm)) {
    return decide(
      'fable-release',
      'verifying',
      'Candidate is ready for a distribution decision; fresh, machine-checked evidence is required.',
      task,
      state,
      'distribution',
    )
  }

  // 10. Another session / agent must resume -> handoff.
  if (HANDOFF_RE.test(norm)) {
    return decide(
      'fable-handoff',
      state?.phase === 'complete' ? 'complete' : 'verifying',
      'Another session or agent must resume; hand off the durable state and the active card.',
      task,
      state,
      'resume',
    )
  }

  // 11. Default: route by current phase when state is present, else discovery.
  if (state !== null && state.phase === 'executing') {
    return decide(
      'fable-execute',
      'executing',
      'Active bounded card exists in the executing phase; implement with immediate local verification.',
      task,
      state,
      'phase',
    )
  }

  return decide(
    'fable-discover',
    'discovering',
    'No stronger signal; establish the smallest load-bearing evidence set before changing code.',
    task,
    state,
    'default',
  )
}

/** Preview-only: returns the decision without any state mutation flag. */
export function routePreview(ctx: RouteContext): RouteDecision {
  const decision = route(ctx)
  return { ...decision, applies: false }
}
