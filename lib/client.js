window.__ModuleLoader__.load({
	id: "mulqi-getfable",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region src/client/index.ts
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
		const READ = "/mulqi-gf-read";
		const WRITE = "/mulqi-gf-write";
		const PING_FALLBACK = {
			pong: false,
			plugin: "mulqi-getfable",
			version: "?"
		};
		function unwrap(raw, fallback) {
			if (raw !== null && typeof raw === "object" && "ok" in raw) {
				const res = raw;
				if (res.ok === true) return {
					value: res.value ?? fallback,
					error: null
				};
				return {
					value: fallback,
					error: {
						code: res.error?.code ?? "rpc",
						message: res.error?.message ?? String(raw)
					}
				};
			}
			return {
				value: raw,
				error: null
			};
		}
		const PANEL_ID = "mulqi-getfable";
		const PANEL_ORDER = 12;
		const SETTINGS_ID = "mulqi-getfable";
		const SETTINGS_ORDER = 40;
		function text(value) {
			if (typeof value === "string") return value;
			if (value === void 0 || value === null) return "";
			return String(value);
		}
		function textSpan(value) {
			return text(value);
		}
		const S = {
			root: {
				display: "flex",
				flexDirection: "column",
				gap: 10,
				padding: 12,
				fontFamily: "ui-sans-serif, system-ui, sans-serif",
				fontSize: 13,
				color: "#d8dbe0"
			},
			tabs: {
				display: "flex",
				gap: 4
			},
			tab: {
				padding: "3px 10px",
				borderRadius: 6,
				border: "1px solid transparent",
				background: "transparent",
				cursor: "pointer",
				fontSize: 12,
				color: "#d8dbe0"
			},
			tabOn: {
				borderColor: "#7aa2ff",
				background: "rgba(122,162,255,0.14)"
			},
			grid: {
				display: "grid",
				gridTemplateColumns: "repeat(2, 1fr)",
				gap: 8
			},
			tile: {
				border: "1px solid rgba(127,127,127,0.28)",
				borderRadius: 8,
				padding: "8px 10px",
				display: "flex",
				flexDirection: "column",
				gap: 4
			},
			tileValue: {
				fontSize: 18,
				fontWeight: 600
			},
			tileDetail: {
				fontSize: 11,
				opacity: .65
			},
			muted: {
				opacity: .65,
				fontSize: 12
			},
			badge: {
				fontSize: 11,
				padding: "1px 6px",
				borderRadius: 999,
				border: "1px solid rgba(127,127,127,0.4)"
			},
			sectionTitle: {
				fontSize: 12,
				letterSpacing: .04,
				textTransform: "uppercase",
				opacity: .7
			},
			row: {
				display: "flex",
				gap: 8,
				alignItems: "baseline",
				padding: "4px 0",
				borderBottom: "1px solid rgba(127,127,127,0.14)"
			},
			input: {
				width: "100%",
				boxSizing: "border-box",
				padding: "6px 8px",
				borderRadius: 6,
				border: "1px solid rgba(127,127,127,0.4)",
				background: "rgba(0,0,0,0.2)",
				color: "#d8dbe0",
				fontSize: 13
			},
			button: {
				padding: "4px 10px",
				borderRadius: 6,
				border: "1px solid rgba(127,127,127,0.4)",
				background: "rgba(127,127,127,0.12)",
				cursor: "pointer",
				fontSize: 12,
				color: "#d8dbe0"
			},
			error: {
				border: "1px solid rgba(200,90,60,0.5)",
				borderRadius: 8,
				padding: "8px 10px",
				color: "#ff9d8a",
				fontSize: 12,
				background: "rgba(200,90,60,0.1)"
			},
			mono: {
				fontFamily: "ui-monospace, monospace",
				fontSize: 11
			}
		};
		const TONE = {
			ok: {
				color: "#8fe0b0",
				background: "rgba(80,180,120,0.14)",
				borderColor: "rgba(80,180,120,0.5)"
			},
			warn: {
				color: "#f2c777",
				background: "rgba(210,160,60,0.16)",
				borderColor: "rgba(210,160,60,0.55)"
			},
			danger: {
				color: "#ff9d8a",
				background: "rgba(200,90,60,0.18)",
				borderColor: "rgba(200,90,60,0.65)"
			},
			neutral: {
				color: "#c3c9d1",
				borderColor: "rgba(127,127,127,0.45)"
			}
		};
		function badge(value, tone) {
			const key = tone ?? "neutral";
			return (0, react.createElement)("span", {
				style: {
					...S.badge,
					...TONE[key]
				},
				className: `gf-badge gf-badge-${key}`
			}, textSpan(value));
		}
		function loadView(load, render, retry, what) {
			if (load.kind === "idle") return (0, react.createElement)("div", { style: S.muted }, `${what}: not loaded yet`);
			if (load.kind === "loading") return (0, react.createElement)("div", { style: S.muted }, `${what}: loading…`);
			if (load.kind === "error") return (0, react.createElement)("div", {
				style: S.error,
				role: "alert"
			}, (0, react.createElement)("span", null, `${what} failed — ${load.error.code}: ${load.error.message}`), " ", (0, react.createElement)("button", {
				style: S.button,
				onClick: retry
			}, "retry"), load.value === void 0 ? null : (0, react.createElement)("div", { style: { marginTop: 6 } }, render(load.value)));
			return render(load.value);
		}
		const TABS = [
			"hub",
			"plan",
			"skills",
			"route",
			"doctor"
		];
		var GfPanelModel = class {
			rpc;
			_status = { kind: "idle" };
			_plan = { kind: "idle" };
			_skills = { kind: "idle" };
			_doctor = { kind: "idle" };
			_route = { kind: "idle" };
			scope;
			constructor(rpc, sessionId) {
				this.rpc = rpc;
				this.scope = sessionId !== void 0 && sessionId !== "" ? { sessionId } : {};
			}
			get status() {
				return this._status;
			}
			get plan() {
				return this._plan;
			}
			get skills() {
				return this._skills;
			}
			get doctor() {
				return this._doctor;
			}
			get route() {
				return this._route;
			}
			async read(endpoint, prev) {
				if (this.rpc === null) return {
					kind: "error",
					error: {
						code: "no-connection",
						message: "client connection unavailable"
					},
					value: prev.value
				};
				try {
					const { value, error } = unwrap(await this.rpc(READ, endpoint, {}), prev.value);
					return error === null ? {
						kind: "ready",
						value
					} : {
						kind: "error",
						error,
						value: prev.value
					};
				} catch (err) {
					return {
						kind: "error",
						error: {
							code: "rpc-transport",
							message: err instanceof Error ? err.message : String(err)
						},
						value: prev.value
					};
				}
			}
			async write(endpoint, payload, prev) {
				if (this.rpc === null) return {
					kind: "error",
					error: {
						code: "no-connection",
						message: "client connection unavailable"
					},
					value: prev.value
				};
				try {
					const { value, error } = unwrap(await this.rpc(WRITE, endpoint, {
						...this.scope,
						...payload
					}), prev.value);
					return error === null ? {
						kind: "ready",
						value
					} : {
						kind: "error",
						error,
						value: prev.value
					};
				} catch (err) {
					return {
						kind: "error",
						error: {
							code: "rpc-transport",
							message: String(err)
						},
						value: prev.value
					};
				}
			}
			refreshAll() {
				this._status = {
					kind: "loading",
					value: this._status.value
				};
				this._plan = {
					kind: "loading",
					value: this._plan.value
				};
				this._skills = {
					kind: "loading",
					value: this._skills.value
				};
				this._doctor = {
					kind: "loading",
					value: this._doctor.value
				};
				this.read("status", this._status).then((v) => this._status = v);
				this.read("plan", this._plan).then((v) => this._plan = v);
				this.read("skills", this._skills).then((v) => this._skills = v);
				this.read("doctor", this._doctor).then((v) => this._doctor = v);
			}
			runRoute(task, apply) {
				this._route = {
					kind: "loading",
					value: this._route.value
				};
				this.write("route", {
					task,
					apply
				}, this._route).then((v) => this._route = v);
			}
			runDoctor(fix) {
				this._doctor = {
					kind: "loading",
					value: this._doctor.value
				};
				this.write("doctor", { fix }, this._doctor).then((v) => this._doctor = v);
			}
		};
		function createModel(rpc, sessionId) {
			return new GfPanelModel(rpc, sessionId);
		}
		function HubView(model) {
			const status = model.status.value;
			if (status === void 0) return (0, react.createElement)("div", { style: S.muted }, "hub: not loaded yet");
			return (0, react.createElement)("div", { style: S.grid }, ...status.metrics.map((metric) => (0, react.createElement)("div", {
				key: metric.label,
				style: S.tile
			}, (0, react.createElement)("div", { style: S.sectionTitle }, text(metric.label)), (0, react.createElement)("div", { style: S.tileValue }, text(metric.value)), metric.detail !== void 0 ? (0, react.createElement)("div", { style: S.tileDetail }, text(metric.detail)) : null, badge(metric.tone, metric.tone))));
		}
		function PlanView(model) {
			const plan = model.plan;
			if (plan.kind !== "ready") return (0, react.createElement)("div", { style: S.muted }, "plan: not loaded yet");
			return (0, react.createElement)("div", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 8
			} }, (0, react.createElement)("div", { style: S.row }, (0, react.createElement)("span", { style: S.sectionTitle }, "attestation"), plan.value.attestation !== null ? (0, react.createElement)("code", { style: S.mono }, text(plan.value.attestation.slice(0, 16))) : (0, react.createElement)("span", { style: S.muted }, "none")), (0, react.createElement)("div", { style: S.row }, (0, react.createElement)("span", { style: S.sectionTitle }, "progress"), (0, react.createElement)("span", { style: S.mono }, `${plan.value.progressPercent}%`)), ...plan.value.phases.map((phase) => (0, react.createElement)("div", {
				key: phase.id,
				style: S.row
			}, badge(phase.status, phase.status === "checked" ? "ok" : phase.status === "deferred" ? "warn" : "neutral"), (0, react.createElement)("span", null, text(phase.title)))));
		}
		function SkillsView(model) {
			const load = model.skills;
			if (load.kind !== "ready") return loadView(load, (skills) => (0, react.createElement)("div", null, "skills"), () => void 0, "skills");
			return (0, react.createElement)("div", null, ...load.value.map((skill) => (0, react.createElement)("div", {
				key: skill.id,
				style: S.row
			}, badge(skill.state, skill.state === "loaded" ? "ok" : skill.state === "error" ? "danger" : "warn"), (0, react.createElement)("span", { style: S.mono }, text(skill.id)))));
		}
		function RouterView(model) {
			const [task, setTask] = (0, react.useState)("");
			const [applied, setApplied] = (0, react.useState)([]);
			const load = model.route;
			return (0, react.createElement)("div", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 8
			} }, (0, react.createElement)("div", { style: {
				display: "flex",
				gap: 6
			} }, (0, react.createElement)("input", {
				style: S.input,
				value: task,
				placeholder: "describe the task to route…",
				onChange: (e) => setTask(e.target.value)
			}), (0, react.createElement)("button", {
				style: S.button,
				onClick: () => model.runRoute(task, false),
				disabled: task.trim() === ""
			}, "preview"), (0, react.createElement)("button", {
				style: {
					...S.button,
					borderColor: "rgba(122,162,255,0.6)"
				},
				onClick: () => model.runRoute(task, true),
				disabled: task.trim() === ""
			}, "apply")), loadView(load, (r) => (0, react.createElement)("div", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 4
			} }, (0, react.createElement)("div", null, (0, react.createElement)("span", { style: S.mono }, text(r.decision)), " → ", (0, react.createElement)("span", { style: S.mono }, text(r.phase)), r.applied ? " (applied)" : " (preview)"), (0, react.createElement)("div", { style: S.muted }, text(r.reason)), r.evidence.length > 0 ? (0, react.createElement)("div", { style: S.tileDetail }, r.evidence.map(text).join(" · ")) : null), () => model.runRoute(task, false), "route"));
		}
		function DoctorView(model) {
			const load = model.doctor;
			return (0, react.createElement)("div", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 8
			} }, (0, react.createElement)("div", { style: {
				display: "flex",
				gap: 6
			} }, (0, react.createElement)("button", {
				style: S.button,
				onClick: () => model.runDoctor(false)
			}, "diagnose"), (0, react.createElement)("button", {
				style: S.button,
				onClick: () => model.runDoctor(true)
			}, "diagnose + repair")), loadView(load, (report) => (0, react.createElement)("div", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 4
			} }, (0, react.createElement)("div", null, badge(report.healthy ? "healthy" : "needs attention", report.healthy ? "ok" : "warn"), ` fixed ${report.fixed} · repaired ${report.repaired}`), ...report.checks.map((check) => (0, react.createElement)("div", {
				key: check.id,
				style: S.row
			}, badge(check.pass ? "pass" : "fail", check.pass ? "ok" : "danger"), (0, react.createElement)("span", null, text(check.label)), (0, react.createElement)("span", { style: S.muted }, text(check.detail)))), report.repairErrors.length > 0 ? (0, react.createElement)("div", { style: S.muted }, report.repairErrors.map(text).join(" · ")) : null), () => model.runDoctor(false), "doctor"));
		}
		function probe(api) {
			return new Promise((resolve) => {
				if (api.rpc === null) {
					resolve({
						ping: {
							ok: false,
							error: {
								code: "no-connection",
								message: "client connection unavailable"
							}
						},
						probedAt: Date.now()
					});
					return;
				}
				api.rpc(READ, "ping", {}).then((raw) => {
					const { value, error } = unwrap(raw, PING_FALLBACK);
					resolve({
						ping: error === null ? {
							ok: true,
							value: value ?? {
								pong: false,
								plugin: "mulqi-getfable",
								version: "?"
							}
						} : {
							ok: false,
							error
						},
						probedAt: Date.now()
					});
				}).catch((err) => resolve({
					ping: {
						ok: false,
						error: {
							code: "rpc-transport",
							message: String(err)
						}
					},
					probedAt: Date.now()
				}));
			});
		}
		function SettingsCard({ rpc }) {
			const [probeState, setProbeState] = (0, react.useState)({
				ping: null,
				probedAt: 0
			});
			const [running, setRunning] = (0, react.useState)(false);
			const selfTest = (0, react.useCallback)(async () => {
				setRunning(true);
				try {
					const result = await probe({ rpc });
					setProbeState(result);
				} finally {
					setRunning(false);
				}
			}, [rpc]);
			(0, react.useEffect)(() => {
				if (probeState.ping === null) selfTest();
			}, [probeState, selfTest]);
			return (0, react.createElement)("div", { style: {
				...S.root,
				background: "transparent"
			} }, (0, react.createElement)("div", { style: S.sectionTitle }, "mulqi-getfable · self-test"), (0, react.createElement)("div", { style: {
				display: "flex",
				gap: 8,
				alignItems: "center"
			} }, (0, react.createElement)("button", {
				style: S.button,
				onClick: selfTest,
				disabled: running
			}, running ? "probing…" : "probe host"), probeState.ping?.ok === true ? badge(`v${probeState.ping.value?.version ?? "?"}`, "ok") : badge(probeState.ping?.ok === false ? probeState.ping.error.code : "unprobed", "warn")));
		}
		function GfPanel({ rpc, sessionId }) {
			const model = modelFor(rpc, sessionId);
			const [tab, setTab] = (0, react.useState)("hub");
			(0, react.useEffect)(() => {
				model.refreshAll();
			}, [model]);
			return (0, react.createElement)("div", { style: S.root }, (0, react.createElement)("div", { style: S.tabs }, ...TABS.map((t) => (0, react.createElement)("button", {
				key: t,
				style: {
					...S.tab,
					...tab === t ? S.tabOn : {}
				},
				onClick: () => setTab(t)
			}, t))), (0, react.createElement)("div", null, tab === "hub" ? HubView(model) : null, tab === "plan" ? PlanView(model) : null, tab === "skills" ? SkillsView(model) : null, tab === "route" ? RouterView(model) : null, tab === "doctor" ? DoctorView(model) : null));
		}
		const MODEL_CACHE = /* @__PURE__ */ new Map();
		function modelFor(rpc, sessionId) {
			const key = `${sessionId ?? "default"}`;
			const existing = MODEL_CACHE.get(key);
			if (existing !== void 0) {
				if (existing.rpc !== rpc) {
					const rebuilt = createModel(rpc, sessionId);
					MODEL_CACHE.set(key, rebuilt);
					return rebuilt;
				}
				return existing;
			}
			const model = createModel(rpc, sessionId);
			MODEL_CACHE.set(key, model);
			return model;
		}
		const mountFailures = [];
		/** For tests only: forget recorded mount failures. */
		function resetGfMountFailures() {
			mountFailures.length = 0;
		}
		function gfMountFailures() {
			return mountFailures;
		}
		function register(ctx, slot, options, component) {
			const slots = ctx.slots;
			if (slots === void 0 || typeof slots.register !== "function") {
				mountFailures.push(`${slot}: the slots service exposes no register()`);
				return null;
			}
			try {
				const disposer = slots.register({
					name: slot,
					...options
				}, component);
				return typeof disposer === "function" ? () => void disposer() : null;
			} catch (error) {
				mountFailures.push(`${slot}: ${error instanceof Error ? error.message : String(error)}`);
				return null;
			}
		}
		function contribute(ctx, slot, build) {
			const slots = ctx.slots;
			if (slots === void 0 || typeof slots.inject !== "function") {
				mountFailures.push(`${slot}: the slots service exposes no inject()`);
				return;
			}
			try {
				const cleanup = slots.inject(slot, build);
				if (typeof ctx.effect === "function" && typeof cleanup === "function") {
					const bound = cleanup.bind(null);
					ctx.effect(() => bound(), `mulqi-getfable: ${slot}`);
				}
			} catch (error) {
				mountFailures.push(`${slot}: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		function rpcOf(ctx) {
			const rpc = ctx.connection?.rpc;
			if (rpc === void 0 || typeof rpc.call !== "function") return null;
			return rpc.call.bind(rpc);
		}
		/**
		* Plugin entry. The exported shape (name/inject/apply) is what the host's
		* client-module loader calls; nothing in here may throw (P4).
		*/
		function apply(rawContext) {
			try {
				const ctx = rawContext !== null && typeof rawContext === "object" ? rawContext : {};
				const rpc = rpcOf(ctx);
				contribute(ctx, "settings.section", () => register(ctx, "settings.section", {
					id: SETTINGS_ID,
					order: SETTINGS_ORDER
				}, () => (0, react.createElement)(SettingsCard, { rpc })));
				contribute(ctx, "conversation.view", () => register(ctx, "conversation.view", {
					id: PANEL_ID,
					order: PANEL_ORDER,
					label: () => "mulqi-getfable"
				}, () => {
					const sessionId = (ctx.sessions?.getSnapshot?.())?.active;
					return (0, react.createElement)(GfPanel, {
						rpc,
						sessionId
					});
				}));
			} catch {}
		}
		/** Cordis services this entry reads off the host context. */
		const inject = [
			"slots",
			"connection",
			"sessions"
		];
		const name = "mulqi-getfable";
		//#endregion
		exports.apply = apply;
		exports.gfMountFailures = gfMountFailures;
		exports.inject = inject;
		exports.name = name;
		exports.resetGfMountFailures = resetGfMountFailures;
		return module.exports;
	}
});
