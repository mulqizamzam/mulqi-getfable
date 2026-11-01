import { createRequire } from "node:module";
import { Service } from "@deepseek-ai/cordis";
import { promises } from "node:fs";
//#region \0rolldown/runtime.js
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
//#endregion
//#region src/core/catalog.ts
const GfSkillRegistry = [
	{
		id: "get-fable",
		order: 0,
		phase: "idle",
		pack: "core",
		description: "Orchestrate software engineering workflows across the canonical lifecycle with deterministic routing and evidence precedence. Use when starting a complex coding task, navigating lifecycle phases, resuming work with durable .fable state, or routing between research, planning, testing, verification, and recovery. Do NOT use when an individual specialist skill already has clear isolated ownership of a bounded subtask.",
		inputs: ["task_description", "current_state"],
		requires: ["repo_access"],
		produces: ["routing_decision"],
		gates: ["state_schema_valid"],
		fallback: null,
		mutatesWorkspace: false,
		parallelSafe: true,
		next: [
			"fable-discover",
			"fable-research",
			"fable-plan",
			"fable-tdd",
			"fable-delegate",
			"fable-execute",
			"fable-verify",
			"fable-review",
			"fable-security",
			"fable-recover",
			"fable-release",
			"fable-handoff"
		],
		keywords: [
			"fable",
			"lifecycle",
			"orchestration",
			"routing"
		],
		audience: "consumer"
	},
	{
		id: "fable-discover",
		order: 10,
		phase: "discovering",
		pack: "core",
		description: "Gather the smallest set of repository, environment, documentation, and runtime evidence needed before planning or changing code. Use when the repository layout, build system, entry points, or runtime behaviour is unknown.",
		inputs: ["exploration_intent"],
		requires: ["repo_access"],
		produces: ["repository_evidence", "environment_facts"],
		gates: ["load_bearing_unknowns_resolved"],
		fallback: "fable-recover",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: [
			"fable-research",
			"fable-plan",
			"fable-tdd",
			"fable-execute"
		],
		keywords: [
			"discover",
			"inspect",
			"trace",
			"repository"
		],
		audience: "consumer"
	},
	{
		id: "fable-research",
		order: 20,
		phase: "discovering",
		pack: "core",
		description: "Resolve current external facts, official documentation, library behaviour, and API contracts against primary sources before implementation. Use when a third-party dependency or external service is uncertain.",
		inputs: ["research_question"],
		requires: ["network_or_docs"],
		produces: ["external_facts", "api_contract"],
		gates: ["primary_source_cited"],
		fallback: "fable-recover",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: [
			"fable-plan",
			"fable-tdd",
			"fable-execute"
		],
		keywords: [
			"research",
			"api",
			"documentation",
			"external"
		],
		audience: "consumer"
	},
	{
		id: "fable-plan",
		order: 30,
		phase: "planned",
		pack: "core",
		description: "Convert discovery evidence into bounded, testable work cards with explicit acceptance criteria and architectural invariants. Use when architecture, decomposition, or contract choice is the load-bearing decision.",
		inputs: ["evidence_set"],
		requires: ["repository_evidence"],
		produces: ["work_cards", "architectural_invariants"],
		gates: ["cards_bounded", "acceptance_explicit"],
		fallback: "fable-recover",
		mutatesWorkspace: false,
		parallelSafe: false,
		next: [
			"fable-tdd",
			"fable-delegate",
			"fable-execute"
		],
		keywords: [
			"plan",
			"architect",
			"decompose",
			"contract"
		],
		audience: "consumer"
	},
	{
		id: "fable-tdd",
		order: 40,
		phase: "executing",
		pack: "core",
		description: "Drive testable behaviour changes and bug fixes through disciplined red-green-refactor cycles with observable regression tests. Use when the next step is a testable behaviour change.",
		inputs: ["work_card"],
		requires: ["test_harness"],
		produces: [
			"failing_test",
			"passing_implementation",
			"regression_test"
		],
		gates: ["red_observed", "green_observed"],
		fallback: "fable-recover",
		mutatesWorkspace: true,
		parallelSafe: false,
		next: ["fable-verify", "fable-review"],
		keywords: [
			"tdd",
			"bug",
			"regression",
			"red-green-refactor"
		],
		audience: "consumer"
	},
	{
		id: "fable-delegate",
		order: 50,
		phase: "planned",
		pack: "core",
		description: "Delegate independent bounded subtasks to parallel workers with strict disjoint ownership and explicit acceptance contracts. Use when genuinely independent cards can run without shared state.",
		inputs: ["independent_cards"],
		requires: ["cards_bounded"],
		produces: ["delegation_plan", "disjoint_ownership"],
		gates: ["no_shared_state", "ownership_disjoint"],
		fallback: "fable-execute",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: ["fable-verify"],
		keywords: [
			"delegate",
			"parallel",
			"fan-out",
			"disjoint"
		],
		audience: "consumer"
	},
	{
		id: "fable-execute",
		order: 60,
		phase: "executing",
		pack: "core",
		description: "Implement one accepted, bounded work card with immediate local verification, invariant preservation, and zero scope drift. Use when a single card is ready to be built.",
		inputs: ["work_card"],
		requires: ["acceptance_contract"],
		produces: ["implementation", "local_verification"],
		gates: ["invariants_preserved", "no_scope_drift"],
		fallback: "fable-recover",
		mutatesWorkspace: true,
		parallelSafe: false,
		next: ["fable-verify"],
		keywords: [
			"execute",
			"implement",
			"build"
		],
		audience: "consumer"
	},
	{
		id: "fable-verify",
		order: 70,
		phase: "verifying",
		pack: "core",
		description: "Falsify implementations and gather fresh, machine-checked acceptance proof across tests, builds, typechecks, and runtime smoke checks before completion. Use when a claim must be proven, not assumed.",
		inputs: ["implementation", "acceptance_contract"],
		requires: ["test_harness"],
		produces: ["verification_evidence"],
		gates: ["fresh_evidence", "machine_checked"],
		fallback: "fable-recover",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: ["fable-review", "fable-release"],
		keywords: [
			"verify",
			"falsify",
			"test",
			"smoke"
		],
		audience: "consumer"
	},
	{
		id: "fable-review",
		order: 80,
		phase: "verifying",
		pack: "core",
		description: "Perform an independent, evidence-grounded review of git diffs against requested specifications, architectural invariants, and code standards. Use when a diff needs a correctness pass by a fresh reviewer.",
		inputs: ["diff", "spec"],
		requires: ["diff_available"],
		produces: ["review_findings"],
		gates: ["independent_reviewer"],
		fallback: "fable-execute",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: ["fable-release"],
		keywords: [
			"review",
			"diff",
			"correctness"
		],
		audience: "consumer"
	},
	{
		id: "fable-security",
		order: 90,
		phase: "verifying",
		pack: "core",
		description: "Conduct threat modeling, vulnerability assessment, secret sanitization, and security review across trust boundaries, auth flows, and untrusted inputs. Use when the task touches a trust boundary, secret, credential, or authorization check.",
		inputs: ["trust_boundary", "diff"],
		requires: ["threat_model"],
		produces: ["security_findings", "sanitized_secrets"],
		gates: ["boundary_map", "no_secret_exposure"],
		fallback: "fable-recover",
		mutatesWorkspace: false,
		parallelSafe: false,
		next: ["fable-verify", "fable-release"],
		keywords: [
			"security",
			"vulnerability",
			"secret",
			"trust-boundary",
			"authz"
		],
		audience: "consumer"
	},
	{
		id: "fable-recover",
		order: 100,
		phase: "recovering",
		pack: "core",
		description: "Diagnose repeated or contradictory failures by proving the execution path before touching product logic, then record a revised hypothesis. Use when two consecutive failures have moved the workflow into recovering.",
		inputs: ["failure_evidence", "hypothesis"],
		requires: ["failure_log"],
		produces: ["revised_hypothesis", "path_proof"],
		gates: ["harness_proven", "execution_path_proven"],
		fallback: "fable-discover",
		mutatesWorkspace: false,
		parallelSafe: false,
		next: ["fable-tdd", "fable-execute"],
		keywords: [
			"recover",
			"diagnose",
			"failure",
			"hypothesis"
		],
		audience: "consumer"
	},
	{
		id: "fable-release",
		order: 110,
		phase: "verifying",
		pack: "core",
		description: "Decide distribution readiness: a candidate is releasable only with fresh, machine-checked evidence matching the current mutation generation. Use when a candidate is ready for a ship / tag / deploy decision.",
		inputs: ["candidate", "evidence"],
		requires: ["verification_evidence"],
		produces: ["release_decision"],
		gates: ["evidence_current_generation"],
		fallback: "fable-verify",
		mutatesWorkspace: false,
		parallelSafe: false,
		next: ["fable-handoff"],
		keywords: [
			"release",
			"ship",
			"deploy",
			"distribution"
		],
		audience: "consumer"
	},
	{
		id: "fable-handoff",
		order: 120,
		phase: "verifying",
		pack: "core",
		description: "Produce a complete, self-contained handoff so another session or agent can resume: durable state, the active card, open findings, and what must be re-verified. Use when work moves to another session or agent.",
		inputs: ["durable_state", "active_card"],
		requires: ["state_complete"],
		produces: ["handoff_document"],
		gates: ["self_contained"],
		fallback: "fable-recover",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: [],
		keywords: [
			"handoff",
			"resume",
			"continue"
		],
		audience: "consumer"
	},
	{
		id: "fable-spark",
		order: 130,
		phase: "idle",
		pack: "intelligence",
		description: "Suggest the single next atomic move inside active work when the route is unclear. Use at a session boundary or when the operator asks what to do next without re-running the whole router.",
		inputs: ["current_state"],
		requires: ["durable_state"],
		produces: ["next_move"],
		gates: [],
		fallback: "get-fable",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: ["fable-execute"],
		keywords: [
			"spark",
			"next",
			"hint"
		],
		audience: "consumer"
	},
	{
		id: "fable-architecture",
		order: 140,
		phase: "planned",
		pack: "design",
		description: "Evaluate architectural triggers (scale, concurrency, domain decoupling, resource intensity) and lock out monolithic scaffolding when a distributed paradigm is warranted. Use at inception when a spec crosses scale or decoupling thresholds.",
		inputs: ["spec"],
		requires: ["spec_present"],
		produces: ["architecture_decision"],
		gates: ["scale_evaluated", "domain_evaluated"],
		fallback: "fable-plan",
		mutatesWorkspace: false,
		parallelSafe: false,
		next: ["fable-plan"],
		keywords: [
			"architecture",
			"microservice",
			"scale",
			"concurrency"
		],
		audience: "consumer"
	},
	{
		id: "fable-config",
		order: 150,
		phase: "idle",
		pack: "system",
		description: "Read and reason about the project configuration surface (toolchain, build flags, environment) before changing it. Use when a task depends on build or runtime configuration and the current values are unknown.",
		inputs: ["config_intent"],
		requires: ["repo_access"],
		produces: ["config_facts"],
		gates: [],
		fallback: "fable-discover",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: ["fable-plan"],
		keywords: [
			"config",
			"toolchain",
			"environment"
		],
		audience: "consumer"
	},
	{
		id: "fable-prove-it",
		order: 160,
		phase: "verifying",
		pack: "core",
		description: "Produce a minimal, runnable proof for a specific claim: a command, a diff, a round-trip, or a measured value. Use when the operator needs one concrete piece of evidence, not a full verification pass.",
		inputs: ["claim"],
		requires: ["claim_falsifiable"],
		produces: ["proof_artifact"],
		gates: ["fresh_evidence"],
		fallback: "fable-verify",
		mutatesWorkspace: false,
		parallelSafe: true,
		next: ["fable-verify"],
		keywords: [
			"prove",
			"evidence",
			"demo"
		],
		audience: "consumer"
	}
];
GfSkillRegistry.length;
/** Render the full SKILL.md body for a catalog entry (used by the skill provider). */
function renderSkillBody(entry) {
	const lines = [];
	lines.push(`# ${entry.id}`, "");
	lines.push(entry.description, "");
	lines.push("## Activate When");
	for (const k of entry.keywords) lines.push(`- ${k}`);
	lines.push("", "## Inputs");
	for (const i of entry.inputs) lines.push(`- ${i}`);
	lines.push("", "## Produces");
	for (const p of entry.produces) lines.push(`- ${p}`);
	lines.push("", "## Gates");
	if (entry.gates.length > 0) for (const g of entry.gates) lines.push(`- ${g}`);
	else lines.push("- (none)");
	lines.push("", "## Next");
	if (entry.next.length > 0) for (const n of entry.next) lines.push(`- ${n}`);
	else lines.push("- (terminal)");
	lines.push("", "## Fallback");
	lines.push(entry.fallback !== null ? `- ${entry.fallback}` : "- (none — top of the lifecycle)");
	return lines.join("\n");
}
const PHASES = [
	"idle",
	"discovering",
	"planned",
	"executing",
	"verifying",
	"recovering",
	"complete",
	"blocked"
];
function emptyState() {
	return {
		schemaVersion: 3,
		phase: "idle",
		mutationGeneration: 0,
		verifiedGeneration: 0,
		failStreak: 0,
		activeCard: null,
		cards: [],
		attestationSha: null,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function isPhase(v) {
	return typeof v === "string" && PHASES.includes(v);
}
/**
* Validate a parsed value against the v3 shape. Returns a normalized state
* when it is a valid (or repairable) project state, and `null` when the
* value is not a state object at all. Invalid-but-present is a *workflow*
* error, not a host error: callers surface it, they do not crash.
*/
function normalizeState(value) {
	if (value === null || typeof value !== "object") return null;
	const raw = value;
	const cards = Array.isArray(raw.cards) ? raw.cards.filter((c) => c !== null && typeof c === "object").map((c) => ({
		id: String(c.id ?? ""),
		status: [
			"open",
			"checked",
			"deferred"
		].includes(c.status) ? c.status : "open",
		title: String(c.title ?? ""),
		...typeof c.evidence === "string" ? { evidence: c.evidence } : {},
		...typeof c.deferredReason === "string" ? { deferredReason: c.deferredReason } : {}
	})) : [];
	return {
		schemaVersion: 3,
		phase: isPhase(raw.phase) ? raw.phase : "idle",
		mutationGeneration: typeof raw.mutationGeneration === "number" ? raw.mutationGeneration : 0,
		verifiedGeneration: typeof raw.verifiedGeneration === "number" ? raw.verifiedGeneration : 0,
		failStreak: typeof raw.failStreak === "number" ? raw.failStreak : 0,
		activeCard: typeof raw.activeCard === "string" ? raw.activeCard : null,
		cards,
		attestationSha: typeof raw.attestationSha === "string" ? raw.attestationSha : null,
		updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : (/* @__PURE__ */ new Date()).toISOString()
	};
}
/**
* Build a project-rooted store. `fableDir` is `.fable` under the project.
* `hasProject` is computed lazily from the presence of the directory.
*/
function openStateStore(projectRoot) {
	const fableDir = `${projectRoot}/.fable`;
	const statePath = `${fableDir}/state.json`;
	const probe = () => hasDir(fableDir);
	function hasDir(path) {
		try {
			return fsSyncStat(path).isDirectory();
		} catch {
			return false;
		}
	}
	const { statSync, readFileSync, writeFileSync, renameSync } = __require("node:fs");
	function fsSyncStat(p) {
		return statSync(p);
	}
	function parse(text) {
		return normalizeState(JSON.parse(text));
	}
	return {
		fableDir,
		statePath,
		get hasProject() {
			return probe();
		},
		loadSync() {
			if (!probe()) return null;
			try {
				return parse(readFileSync(statePath, "utf8"));
			} catch {
				return null;
			}
		},
		async load() {
			if (!await promises.stat(fableDir).then((s) => s.isDirectory()).catch(() => false)) return null;
			try {
				return parse(await promises.readFile(statePath, "utf8"));
			} catch {
				return null;
			}
		},
		saveSync(next) {
			ensureDir(fableDir);
			const tmp = `${statePath}.${process.pid}.tmp`;
			writeFileSync(tmp, JSON.stringify(next, null, 2));
			renameSync(tmp, statePath);
		},
		async save(next) {
			await promises.mkdir(fableDir, { recursive: true });
			const tmp = `${statePath}.${process.pid}.tmp`;
			await promises.writeFile(tmp, JSON.stringify(next, null, 2));
			await promises.rename(tmp, statePath);
		},
		async repair() {
			const base = await this.load() ?? emptyState();
			const repaired = {
				...base,
				failStreak: Math.min(base.failStreak, 2),
				phase: isPhase(base.phase) ? base.phase : "idle",
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			};
			await this.save(repaired);
			return repaired;
		}
	};
	function ensureDir(dir) {
		try {
			statSync(dir);
		} catch {
			const { mkdirSync } = __require("node:fs");
			mkdirSync(dir, { recursive: true });
		}
	}
}
//#endregion
//#region src/core/ledger.ts
const CHECKED_RE = /^-\s\[[xX]\]\s+(.*)$/;
const OPEN_RE = /^-\s\[\s\]\s+(.*)$/;
const DEFERRED_RE = /^-\s\[\~\]\s+(.*)$/;
const EVIDENCE_RE = /--\s*evidence\s*[:：]?\s*|\bevidence\b|证据/i;
const ACCEPTANCE_HINT_RE = /\b(accept|验收|test|测试|验证|verify)\b|`[^`]+`/i;
const DEFER_REASON_RE = /\b(deferred|搁置|推迟)\b\s*[:：]\s*\S{2,}/i;
function splitCards(text) {
	const lines = text.split(/\r?\n/);
	const cards = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		let card = null;
		if (line.startsWith("- [x]") || line.startsWith("- [X]")) {
			const m = line.match(CHECKED_RE);
			if (m !== null) card = {
				status: "checked",
				title: m[1].trim(),
				line: i + 1
			};
		} else if (line.startsWith("- [ ]")) {
			const m = line.match(OPEN_RE);
			if (m !== null) card = {
				status: "open",
				title: m[1].trim(),
				line: i + 1
			};
		} else if (line.startsWith("- [~]")) {
			const m = line.match(DEFERRED_RE);
			if (m !== null) card = {
				status: "deferred",
				title: m[1].trim(),
				line: i + 1
			};
		}
		if (card === null) continue;
		let detail = "";
		let j = i + 1;
		while (j < lines.length) {
			const next = lines[j];
			if (next.trim() === "" || next.trimStart().startsWith("- [")) break;
			if (/^\s{2,}/.test(next) && next.trim() !== "") detail += `${next.trim()} `;
			else break;
			j += 1;
		}
		cards.push({
			...card,
			detail: detail.trim() || void 0
		});
	}
	return cards;
}
function parseLedger(text) {
	return splitCards(text);
}
function lintLedger(fileName, text) {
	const cards = parseLedger(text);
	const findings = [];
	let open = 0;
	let checked = 0;
	let deferred = 0;
	for (const card of cards) if (card.status === "open") {
		open += 1;
		if (ACCEPTANCE_HINT_RE.test(card.title)) continue;
		findings.push({
			file: fileName,
			rule: "open-card-acceptance",
			detail: `line ${card.line}: open card "${card.title}" does not hint at its acceptance (a test / 验收 / a backtick command).`
		});
	} else if (card.status === "checked") {
		checked += 1;
		if (card.detail !== void 0 && EVIDENCE_RE.test(card.detail)) continue;
		if (EVIDENCE_RE.test(card.title)) continue;
		findings.push({
			file: fileName,
			rule: "closed-card-evidence",
			detail: `line ${card.line}: closed card "${card.title}" has no evidence marker (-- evidence: / 证据:).`
		});
	} else {
		deferred += 1;
		const hay = [card.detail ?? "", card.title].join(" ");
		if (DEFER_REASON_RE.test(hay)) continue;
		findings.push({
			file: fileName,
			rule: "deferred-card-reason",
			detail: `line ${card.line}: deferred card "${card.title}" has no reason (-- deferred: why / 推迟:).`
		});
	}
	return {
		open,
		checked,
		deferred,
		findings
	};
}
//#endregion
//#region src/core/doctor.ts
/**
* Doctor: bounded diagnostics over the .fable project state.
*
* Read-only by default (`fix: false`); with `fix: true` it performs one
* bounded, idempotent repair (rebuild a malformed or missing state.json from
* the ledger, clamped) and reports what it did. Mirrors the upstream
* doctor semantics: { fixed, repaired, repairErrors } plus a per-check list.
*/
function runDoctor(input) {
	const { store, ledgerText, fix = false } = input;
	const checks = [];
	const repairErrors = [];
	let repaired = 0;
	let fixed = 0;
	const hasProject = store.hasProject;
	checks.push({
		id: "opt-in",
		label: ".fable/ project opt-in",
		pass: hasProject,
		detail: hasProject ? `found ${store.fableDir}` : "no .fable/ directory — project is not opted in; enforcement is a no-op"
	});
	let state = store.loadSync();
	if ((hasProject || fix) && state === null) {
		checks.push({
			id: "state-schema",
			label: "state.json schema v3",
			pass: false,
			detail: "state.json is missing or malformed"
		});
		if (fix) try {
			state = emptyState();
			if (ledgerText !== void 0) {
				const parsed = lintLedger("task_plan.md", ledgerText);
				state = {
					...state,
					failStreak: Math.min(parsed.open === 0 ? 2 : state.failStreak, 2)
				};
			}
			store.saveSync(state);
			repaired += 1;
		} catch (err) {
			repairErrors.push(`state rebuild: ${err instanceof Error ? err.message : String(err)}`);
		}
	} else {
		const valid = state !== null;
		const detail = state !== null ? `phase ${state.phase}, v${state.schemaVersion}` : "no project state";
		checks.push({
			id: "state-schema",
			label: "state.json schema v3",
			pass: valid,
			detail
		});
	}
	if (state !== null) {
		const debt = state.mutationGeneration - state.verifiedGeneration;
		checks.push({
			id: "generation-debt",
			label: "unverified mutation debt",
			pass: debt <= 0,
			detail: debt > 0 ? `${debt} generation(s) mutated without a fresh verification` : "no debt"
		});
	}
	if (state !== null) {
		const stuck = state.failStreak >= 2;
		checks.push({
			id: "fail-streak",
			label: "failure streak",
			pass: !stuck,
			detail: stuck ? `failStreak ${state.failStreak} ≥ 2 — workflow is in recovery; change the diagnosis before another edit` : `failStreak ${state.failStreak}`
		});
	}
	if (ledgerText !== void 0) {
		const parsed = lintLedger("task_plan.md", ledgerText);
		const clean = parsed.findings.length === 0;
		checks.push({
			id: "ledger-lint",
			label: "ledger discipline",
			pass: clean,
			detail: clean ? `${parsed.open} open, ${parsed.checked} checked, ${parsed.deferred} deferred — all carry their markers` : `${parsed.findings.length} finding(s): ${parsed.findings.map((f) => f.rule).join(", ")}`
		});
		if (fix && !clean) for (const finding of parsed.findings) repairErrors.push(`ledger ${finding.file}:${finding.detail}`);
	}
	if (fix && hasProject && state !== null && state.failStreak > 2) {
		const clamped = {
			...state,
			failStreak: 2,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		try {
			store.saveSync(clamped);
			fixed += 1;
		} catch (err) {
			repairErrors.push(`clamp failStreak: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
	const healthy = checks.every((c) => c.pass) && repairErrors.length === 0;
	return {
		checks,
		fixed,
		repaired,
		repairErrors,
		healthy
	};
}
//#endregion
//#region src/core/route.ts
const SECURITY_RE = /(vulnerab|threat|authz|authoriz|secret(s)?\b|credential|trust[- ]boundary|xss|csrf|ssrf|injection|cve|cvss|pen[- ]?test|exploit|malware|ransomware|crypto)/i;
const RECOVERY_RE = /(repeated(?:ly)?\s+(?:fail|attempt)|contradict|fails?\s+again|broken\s+build|stale\s+(?:proof|cache|evidence)|flaky\s+(?:test|failure)|errors?\s+on\s+(?:retry|re-run)|two\s+(?:consecutive|failed)|failure\s+streak)/i;
const RESEARCH_RE = /(external api|third[- ]party|upstream|library behaviour|version (compat|support)|npm|documentation|official docs|current (spec|api)|contract (change|update))/i;
const DISCOVER_RE = /(repository|codebase|source tree|entry point|module map|how (is|are) (this|the)|trace|inspect|what (does|is) (the|this) (repo|project)|unknown (runtime|env))/i;
const PLAN_RE = /(architectur|decompos|design|contract|schema|data model|api design|boundar(y|ies)|scaffold|blueprint|plan|spec)/i;
const TDD_RE = /(bug|regression|fix|test|red[- ]green|testable|behaviour (change)|spec (gap|update))/i;
const REVIEW_RE = /(review|diff|pull request|correctness|quality (check|gate)|lint|style|code (smell|review))/i;
const DELEGATE_RE = /(independent (cards|subtask)|parallel|delegate|fan[- ]out|disjoint (scope|ownership)|multi[- ]worker)/i;
const COMPLETE_RE = /(release|ship|distribut|publish|tag|deploy|distribution decision)/i;
const HANDOFF_RE = /(resume|another session|another agent|handoff|hand[- ]off|continue (next|tomorrow)|pick (up|off))/i;
function collectEvidence(task, state, matched) {
	const evidence = [];
	if (matched) evidence.push(`task text: "${matched}"`);
	if (state !== null) {
		evidence.push(`phase: ${state.phase}`);
		if (state.failStreak > 0) evidence.push(`failStreak: ${state.failStreak}`);
		if (state.activeCard !== null) evidence.push(`activeCard: ${state.activeCard}`);
		const debt = state.mutationGeneration - state.verifiedGeneration;
		if (debt > 0) evidence.push(`unverified mutation debt: ${debt}`);
	}
	return evidence;
}
function decide(skill, phase, reason, task, state, matched) {
	return {
		skill,
		phase,
		reason,
		evidence: collectEvidence(task, state, matched),
		applies: true
	};
}
function route(ctx) {
	const { task, state } = ctx;
	const norm = task.trim();
	if (state !== null && state.failStreak >= 2 || RECOVERY_RE.test(norm)) return decide("fable-recover", "recovering", "Repeated or contradictory failure outranks execution; change the diagnosis before another code edit.", task, state, "failure");
	if (SECURITY_RE.test(norm)) return decide("fable-security", "verifying", "Trust-boundary / vulnerability / secret work routes to security even when the diff also needs a general review.", task, state, "security");
	if (RESEARCH_RE.test(norm)) return decide("fable-research", "discovering", "Current external fact or API uncertainty resolves against primary sources before implementation.", task, state, "external");
	if (DISCOVER_RE.test(norm)) return decide("fable-discover", "discovering", "Repository / environment / runtime evidence is unknown; gather the smallest load-bearing set.", task, state, "repo");
	if (DELEGATE_RE.test(norm)) return decide("fable-delegate", "planned", "Independent bounded subtasks with disjoint ownership delegate to parallel workers.", task, state, "delegate");
	if (PLAN_RE.test(norm)) return decide("fable-plan", "planned", "Architecture / decomposition / contract choice converts discovery evidence into bounded, testable cards.", task, state, "architecture");
	if (TDD_RE.test(norm)) return decide("fable-tdd", "executing", "A testable behaviour change or bug drives a red-green-refactor cycle.", task, state, "testable");
	if (REVIEW_RE.test(norm)) return decide("fable-review", "verifying", "Independent, evidence-grounded review of a git diff against spec and invariants.", task, state, "diff");
	if (COMPLETE_RE.test(norm)) return decide("fable-release", "verifying", "Candidate is ready for a distribution decision; fresh, machine-checked evidence is required.", task, state, "distribution");
	if (HANDOFF_RE.test(norm)) return decide("fable-handoff", state?.phase === "complete" ? "complete" : "verifying", "Another session or agent must resume; hand off the durable state and the active card.", task, state, "resume");
	if (state !== null && state.phase === "executing") return decide("fable-execute", "executing", "Active bounded card exists in the executing phase; implement with immediate local verification.", task, state, "phase");
	return decide("fable-discover", "discovering", "No stronger signal; establish the smallest load-bearing evidence set before changing code.", task, state, "default");
}
/** Preview-only: returns the decision without any state mutation flag. */
function routePreview(ctx) {
	return {
		...route(ctx),
		applies: false
	};
}
//#endregion
//#region src/policy-service.ts
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
const PLUGIN_VERSION = "1.0.1";
var GfPolicy = class extends Service {
	static inject = ["tools", "skills"];
	constructor(ctx) {
		super(ctx, "gf");
		this.wireTools();
		this.wireHooks();
		this.wireSkillProvider();
	}
	wireTools() {
		const tools = this.ctx.tools;
		tools.register(this.toolSpec("gf_status", "Return the canonical mulqi-getfable runtime state: active phase, failure streak against the recovery threshold, unverified mutation debt, plan progress, and doctor health.", async (_args, exec) => ok(this.status(await this.resolveRoot(exec)))));
		tools.register(this.toolSpec("gf_route", "Execute the mulqi-getfable task router on a task string. Read-only by default (apply omitted/false); apply:true persists the decision into the durable .fable state.", (args, exec) => this.routeTool(args, exec), routeParams()));
		tools.register(this.toolSpec("gf_doctor", "Run bounded mulqi-getfable diagnostics over the .fable project state. With fix:true, perform one idempotent bounded repair and report what it changed.", (args, exec) => this.doctorTool(args, exec), doctorParams()));
		tools.register(this.toolSpec("gf_skills", "Return the registry of mulqi-getfable canonical lifecycle skills with categories and load state.", () => ok(this.skillInfos())));
	}
	async routeTool(args, exec) {
		const task = typeof args.task === "string" ? args.task : "";
		if (task === "") return fail("bad-request", "gf_route requires a non-empty task string");
		return this.routeResponse({
			task,
			apply: args.apply === true
		}, await this.resolveRoot(exec));
	}
	async doctorTool(args, exec) {
		return this.doctor(args.fix === true, await this.resolveRoot(exec));
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
	async resolveRoot(exec) {
		if (exec !== void 0 && exec !== null && exec.agent !== void 0) try {
			const get = this.ctx.get;
			const dirs = typeof get === "function" ? get.call(this.ctx, "workingDirectory") : void 0;
			if (dirs !== void 0 && dirs !== null && typeof dirs.ensure === "function") {
				const cwd = await dirs.ensure(exec.agent, exec.signal);
				if (typeof cwd === "string" && cwd !== "") return cwd;
			}
		} catch {}
		return process.cwd();
	}
	toolSpec(name, description, body, parameters = {}) {
		return {
			name,
			description,
			parameters,
			output: {
				schema: envelopeSchema(),
				render(_args, value) {
					return [typeof value === "string" ? {
						type: "text",
						text: value
					} : {
						type: "text",
						text: JSON.stringify(value, null, 2)
					}];
				}
			},
			isConcurrencySafe: () => name === "gf_status" || name === "gf_skills",
			async execute(args, exec) {
				return body(args ?? {}, exec);
			}
		};
	}
	wireHooks() {
		const on = (e, l) => this.ctx.on(e, l);
		on("agent/pre-step", async (payload, next) => {
			try {
				await this.applyContextSummary(payload);
			} catch {}
			return next();
		});
		on("tools/execute", async (exec, next) => {
			let result;
			try {
				result = await next();
			} finally {
				try {
					await this.noteMutation(exec);
				} catch {}
			}
			return result;
		});
		on("tools/result", (exec, result) => {
			this.noteResult(exec, result).catch(() => {});
		});
		on("session/event", () => {
			try {
				this.journal();
			} catch {}
		});
	}
	async applyContextSummary(exec) {
		const store = openStateStore(await this.resolveRoot(exec));
		if (!store.hasProject) return;
		const state = store.loadSync();
		if (state === null) return;
		const debt = Math.max(0, state.mutationGeneration - state.verifiedGeneration);
		const summary = `[mulqi-getfable] phase=${state.phase} failStreak=${state.failStreak}/2 mutationDebt=${debt} activeCard=${state.activeCard ?? "none"}`;
		this.ctx.logger?.("gf")?.info?.(`[mulqi-getfable] ${summary}`);
	}
	async noteMutation(exec) {
		const name = String(exec?.name ?? "");
		if (!MUTATING_TOOLS.has(normalizeToolName(name))) return;
		const store = openStateStore(await this.resolveRoot(exec));
		if (!store.hasProject) return;
		const state = store.loadSync();
		if (state === null) return;
		store.saveSync({
			...state,
			mutationGeneration: state.mutationGeneration + 1,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	async noteResult(exec, result) {
		const name = String(exec?.name ?? "").toLowerCase();
		if (name !== "bash" && name !== "shell") return;
		const raw = result;
		const isError = raw?.is_error === true || raw?.isError === true || typeof raw?.output === "string" && /\bexit\s*code\s*[:=]?\s*[1-9]\d*/i.test(raw.output);
		const store = openStateStore(await this.resolveRoot(exec));
		if (!store.hasProject) return;
		const state = store.loadSync();
		if (state === null) return;
		const failStreak = isError ? state.failStreak + 1 : 0;
		store.saveSync({
			...state,
			failStreak,
			phase: failStreak >= 2 ? "recovering" : state.phase,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	journal() {
		this.ctx.logger?.("gf")?.debug?.(`gf journal t=${Date.now()}`);
	}
	wireSkillProvider() {
		this.ctx.skills.registerProvider(() => ({
			name: "mulqi-getfable",
			async list() {
				return GfSkillRegistry.map((entry) => ({
					name: entry.id,
					description: entry.description,
					whenToUse: entry.description,
					rank: 600,
					locator: entry.id,
					source: "bundled",
					provider: "mulqi-getfable",
					invocation: {
						modelInvocable: true,
						userInvocable: true
					}
				}));
			},
			async get(candidate, _options) {
				const locator = candidate?.locator;
				if (typeof locator !== "string") return void 0;
				const entry = GfSkillRegistry.find((s) => s.id === locator);
				if (entry === void 0) return void 0;
				return {
					name: entry.id,
					description: entry.description,
					whenToUse: entry.description,
					content: renderSkillBody(entry),
					source: "bundled",
					provider: "mulqi-getfable",
					invocation: {
						modelInvocable: true,
						userInvocable: true
					},
					resourceBase: {
						kind: "opaque",
						description: `mulqi-getfable bundled skill ${entry.id}. No external companion references are bundled.`
					}
				};
			}
		}));
	}
	/** Endpoint dispatcher used by `src/host/index.ts` for a channel kind. */
	endpointDispatcher(kind) {
		return async (_channel, endpoint, payload) => {
			if (kind === "read") return this.readEndpoint(endpoint, payload);
			return this.writeEndpoint(endpoint, payload);
		};
	}
	async readEndpoint(endpoint, _payload) {
		switch (endpoint) {
			case "ping": return ok(ping());
			case "status": return ok(this.status());
			case "plan": return ok(this.plan());
			case "skills": return ok(this.skillInfos());
			case "doctor": return ok(this.doctor(false));
			default: return fail("unknown-endpoint", `no read endpoint named "${endpoint}"`);
		}
	}
	async writeEndpoint(endpoint, payload) {
		switch (endpoint) {
			case "route": {
				const req = payload;
				if (typeof req?.task !== "string") return fail("bad-request", "route requires a string task");
				return ok(this.routeResponse(req));
			}
			case "doctor": {
				const req = payload;
				return ok(this.doctor(req?.fix === true));
			}
			default: return fail("unknown-endpoint", `no write endpoint named "${endpoint}"`);
		}
	}
	/**
	* Open the state store at an already-resolved project root.
	*
	* Takes a root string only -- never a ToolRunContext. Accepting the exec here
	* is exactly how an unresolved context used to fall through to process.cwd()
	* and read the wrong project.
	*/
	storeFor(root) {
		return openStateStore(root ?? process.cwd());
	}
	status(root) {
		const { state } = this.serve(root);
		const phase = state?.phase ?? "idle";
		const failStreak = state?.failStreak ?? 0;
		const mutationDebt = state === null ? 0 : Math.max(0, state.mutationGeneration - state.verifiedGeneration);
		const planProgress = planProgressPercent(state);
		const doctor = this.doctor(false, root).healthy;
		return {
			version: PLUGIN_VERSION,
			phase,
			failStreak,
			recoveryThreshold: 2,
			mutationDebt,
			activeCard: state?.activeCard ?? null,
			planProgress,
			doctor,
			metrics: [
				{
					label: "Active work card",
					value: state?.activeCard ?? "none",
					tone: "neutral",
					detail: mutationDebt > 0 ? `${mutationDebt} generation(s) unverified` : "no unverified debt"
				},
				{
					label: "Planning phase progress",
					value: `${planProgress}%`,
					tone: planProgress >= 100 ? "ok" : "neutral"
				},
				{
					label: "Failure streak",
					value: `${failStreak}/2`,
					tone: failStreak >= 2 ? "danger" : failStreak === 1 ? "warn" : "ok",
					detail: failStreak >= 2 ? "recovery triggered" : "below recovery threshold"
				},
				{
					label: "Available skills",
					value: String(GfSkillRegistry.length),
					tone: "neutral",
					detail: "bundled lifecycle skills"
				}
			]
		};
	}
	plan(root) {
		const { state } = this.serve(root);
		const cards = state?.cards ?? [];
		const phases = cards.map((card, i) => ({
			id: card.id !== "" ? card.id : `card-${i}`,
			title: card.title,
			status: card.status,
			progress: card.status === "checked" ? 100 : 0
		}));
		const total = cards.length;
		const done = cards.filter((c) => c.status === "checked").length;
		return {
			attestation: state?.attestationSha ?? null,
			phases,
			progressPercent: total === 0 ? 0 : Math.round(done / total * 100)
		};
	}
	skillInfos() {
		return GfSkillRegistry.map((entry) => ({
			id: entry.id,
			name: entry.id,
			description: entry.description,
			state: "loaded"
		}));
	}
	doctor(fix, root) {
		const store = this.storeFor(root);
		let ledgerText;
		try {
			const fs = __require("node:fs");
			const candidate = `${store.fableDir}/task_plan.md`;
			const atRoot = `${store.fableDir.slice(0, -6)}/task_plan.md`;
			const path = fs.existsSync(candidate) ? candidate : atRoot;
			if (fs.existsSync(path)) ledgerText = fs.readFileSync(path, "utf8");
		} catch {
			ledgerText = void 0;
		}
		return runDoctor({
			store,
			ledgerText,
			fix
		});
	}
	routeResponse(req, root) {
		const { state } = this.serve(root);
		const decision = route({
			task: req.task,
			state
		});
		if (req.apply === true) {
			const store = this.storeFor(root);
			if (store.hasProject) {
				const base = state ?? emptyState();
				const next = {
					...base,
					phase: decision.phase,
					activeCard: base.activeCard ?? decision.skill,
					updatedAt: (/* @__PURE__ */ new Date()).toISOString()
				};
				store.saveSync(next);
			}
			return {
				decision: decision.skill,
				phase: decision.phase,
				reason: decision.reason,
				evidence: decision.evidence,
				applied: true
			};
		}
		const preview = routePreview({
			task: req.task,
			state
		});
		return {
			decision: preview.skill,
			phase: preview.phase,
			reason: preview.reason,
			evidence: preview.evidence,
			applied: false
		};
	}
	/** Load-or-default for the current project root. */
	serve(root) {
		const store = this.storeFor(root);
		return {
			store,
			state: store.loadSync()
		};
	}
};
function planProgressPercent(state) {
	if (state === null || state.cards.length === 0) return 0;
	const done = state.cards.filter((c) => c.status === "checked").length;
	return Math.round(done / state.cards.length * 100);
}
function ok(value) {
	return {
		ok: true,
		value
	};
}
function fail(code, message) {
	return {
		ok: false,
		error: {
			code,
			message
		}
	};
}
function ping() {
	return {
		pong: true,
		plugin: "mulqi-getfable",
		version: PLUGIN_VERSION
	};
}
function envelopeSchema() {
	return {
		type: "object",
		properties: {
			ok: { type: "boolean" },
			value: {},
			error: {
				type: "object",
				properties: {
					code: { type: "string" },
					message: { type: "string" }
				}
			}
		}
	};
}
function routeParams() {
	return {
		type: "object",
		properties: {
			task: {
				type: "string",
				description: "The task or intent to route."
			},
			apply: {
				type: "boolean",
				description: "Persist the decision into the durable .fable state.",
				default: false
			}
		},
		required: ["task"]
	};
}
function doctorParams() {
	return {
		type: "object",
		properties: { fix: {
			type: "boolean",
			description: "Run one bounded, idempotent repair.",
			default: false
		} }
	};
}
function normalizeToolName(value) {
	return value.toLowerCase().replace(/[-_]/g, "");
}
const MUTATING_TOOLS = new Set([
	"edit",
	"write",
	"multiedit",
	"notebookedit",
	"apply-patch",
	"write-file",
	"write-to-file",
	"replace",
	"replace-file-content",
	"multi-replace-file-content",
	"create-file",
	"delete-file",
	"move-file",
	"rename-file"
].map(normalizeToolName));
//#endregion
//#region src/core/wire.ts
/** The two channel names (host-side literals; the client re-declares them). */
const GF_READ_CHANNEL = "/mulqi-gf-read";
const GF_WRITE_CHANNEL = "/mulqi-gf-write";
//#endregion
//#region src/host/index.ts
var host_default = GfPolicy;
/** Mount the two host RPC channels (web-only; no-op on a headless profile). */
function wireGfRpc(ctx) {
	ctx.inject(["connection"], (injected) => {
		const connection = injected.connection;
		if (connection === void 0 || connection === null) return;
		const rpc = connection.rpc;
		if (rpc === void 0 || typeof rpc.handle !== "function") return;
		const policy = ctx.gf;
		const readDispatcher = policy.endpointDispatcher?.("read");
		const writeDispatcher = policy.endpointDispatcher?.("write");
		if (typeof readDispatcher === "function") rpc.handle(GF_READ_CHANNEL, readDispatcher);
		if (typeof writeDispatcher === "function") rpc.handle(GF_WRITE_CHANNEL, writeDispatcher);
	});
}
//#endregion
export { GfPolicy, PLUGIN_VERSION, host_default as default, wireGfRpc };
