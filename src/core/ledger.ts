/**
 * Human-ledger parsing and discipline lint for mulqi-getfable.
 *
 * A project opts in with a `.fable/` directory and a `task_plan.md` ledger.
 * Cards are markdown checklist lines:
 *
 *   - [ ] open card                 (must hint at acceptance)
 *   - [x] checked card              (must carry an evidence marker)
 *   - [~] deferred card             (must carry a deferred reason)
 *
 * `lintLedger` is the machine-checkable acceptance for the discipline itself:
 * it names the file and the rule for each finding, so a commit gate or the
 * doctor can surface it.
 */

export interface LedgerFinding {
  readonly file: string
  readonly rule: string
  readonly detail: string
}

export interface ParsedLedger {
  readonly open: number
  readonly checked: number
  readonly deferred: number
  readonly findings: LedgerFinding[]
}

export interface LedgerCard {
  readonly status: 'open' | 'checked' | 'deferred'
  readonly title: string
  readonly line: number
  readonly detail?: string
}

const CHECKED_RE = /^-\s\[[xX]\]\s+(.*)$/
const OPEN_RE = /^-\s\[\s\]\s+(.*)$/
const DEFERRED_RE = /^-\s\[\~\]\s+(.*)$/
const EVIDENCE_RE = /--\s*evidence\s*[:：]?\s*|\bevidence\b|证据/i
const ACCEPTANCE_HINT_RE = /\b(accept|验收|test|测试|验证|verify)\b|`[^`]+`/i
const DEFER_REASON_RE = /\b(deferred|搁置|推迟)\b\s*[:：]\s*\S{2,}/i

function splitCards(text: string): LedgerCard[] {
  const lines = text.split(/\r?\n/)
  const cards: LedgerCard[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    let card: LedgerCard | null = null
    if (line.startsWith('- [x]') || line.startsWith('- [X]')) {
      const m = line.match(CHECKED_RE)
      if (m !== null) card = { status: 'checked', title: m[1].trim(), line: i + 1 }
    } else if (line.startsWith('- [ ]')) {
      const m = line.match(OPEN_RE)
      if (m !== null) card = { status: 'open', title: m[1].trim(), line: i + 1 }
    } else if (line.startsWith('- [~]')) {
      const m = line.match(DEFERRED_RE)
      if (m !== null) card = { status: 'deferred', title: m[1].trim(), line: i + 1 }
    }
    if (card === null) continue
    // A detail line (indented, following) carries the evidence / reason.
    let detail = ''
    let j = i + 1
    while (j < lines.length) {
      const next = lines[j]
      if (next.trim() === '' || next.trimStart().startsWith('- [')) break
      if (/^\s{2,}/.test(next) && next.trim() !== '') detail += `${next.trim()} `
      else break
      j += 1
    }
    cards.push({ ...card, detail: detail.trim() || undefined })
  }
  return cards
}

export function parseLedger(text: string): LedgerCard[] {
  return splitCards(text)
}

export function lintLedger(fileName: string, text: string): ParsedLedger {
  const cards = parseLedger(text)
  const findings: LedgerFinding[] = []
  let open = 0
  let checked = 0
  let deferred = 0
  for (const card of cards) {
    if (card.status === 'open') {
      open += 1
      if (ACCEPTANCE_HINT_RE.test(card.title)) continue
      findings.push({
        file: fileName,
        rule: 'open-card-acceptance',
        detail: `line ${card.line}: open card "${card.title}" does not hint at its acceptance (a test / 验收 / a backtick command).`,
      })
    } else if (card.status === 'checked') {
      checked += 1
      if (card.detail !== undefined && EVIDENCE_RE.test(card.detail)) continue
      if (EVIDENCE_RE.test(card.title)) continue
      findings.push({
        file: fileName,
        rule: 'closed-card-evidence',
        detail: `line ${card.line}: closed card "${card.title}" has no evidence marker (-- evidence: / 证据:).`,
      })
    } else {
      deferred += 1
      const hay = [card.detail ?? '', card.title].join(' ')
      if (DEFER_REASON_RE.test(hay)) continue
      findings.push({
        file: fileName,
        rule: 'deferred-card-reason',
        detail: `line ${card.line}: deferred card "${card.title}" has no reason (-- deferred: why / 推迟:).`,
      })
    }
  }
  return { open, checked, deferred, findings }
}
