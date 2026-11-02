# mulqi-getfable

A portable coding-lifecycle discipline for **DeepSeek Harness (DSH)**:
deterministic routing across 17 bundled lifecycle skills, a durable `.fable/`
state machine, mutation-aware verification, a bounded doctor, and a
DSH-native web dashboard.

Everything here is a DSH-native mechanism: one cordis service, five tools,
four observational hooks, a bundled skill provider, two host RPC channels,
and a web client panel.

## What it is

One `Service` (`ctx.gf`) owns the whole loop:

| Concern | Where |
|---|---|
| Durable state machine | `.fable/state.json` (schema v3: phase, mutationGeneration, verifiedGeneration, failStreak, activeCard, ledger cards) |
| Deterministic router | `src/core/route.ts` — evidence precedence: repeated failure → `fable-recover`; security keyword → `fable-security`; external fact → `fable-research`; repo unknown → `fable-discover`; decomposition → `fable-plan`; independent cards → `fable-delegate`; testable change → `fable-tdd`; diff → `fable-review`; distribution → `fable-release`; resume → `fable-handoff` |
| Bounded doctor | `src/core/doctor.ts` — checks opt-in, schema, generation debt, fail-streak, ledger lint; one idempotent repair on `fix:true` |
| Human ledger | `task_plan.md` cards (`- [ ]` / `- [x]` / `- [~]`) with the acceptance / evidence / reason markers lint-checked |
| Lifecycle hooks | `agent/pre-step` (context summary), `tools/execute` (advance mutation generation on write tools), `tools/result` (record command success/failure → fail-streak → recovery), `session/event` (privacy-minimal journal) |
| Tools | `gf_status`, `gf_route` (preview or apply), `gf_doctor` (diagnose or repair), `gf_skills` (registry), `gf_handoff` (self-contained handoff document) |
| Skill catalog | 17 lifecycle skills, registered as a read-only provider on `ctx.skills` |
| Web dashboard | Fable Hub panel (`conversation.view`) + settings self-test card (`settings.section`), talking to the host over `/mulqi-gf-read` + `/mulqi-gf-write` |

## How it runs

```
[project]                [agent host]                [web client]
  .fable/state.json  <-->  ctx.gf (GfPolicy)  <-->   Fable Hub panel
  task_plan.md           tools: gf_*            /mulqi-gf-read  (status/plan/skills/doctor)
                         hooks: pre-step,       /mulqi-gf-write (route{task,apply}, doctor{fix})
                                 tools/execute, tools/result, session/event
```

A project is **opt-in**: no `.fable/` directory means no enforcement, every
hook is a no-op, and the panel shows truthful "not loaded" states. Once a
`.fable/` exists, the state machine is live and the dashboard reads it in
real time.

## Tools

| Tool | Purpose |
|---|---|
| `gf_status` | Canonical runtime state: phase, fail-streak vs threshold, unverified mutation debt, plan progress, doctor health. |
| `gf_route` | Route a task string. Read-only by default; `apply:true` persists the decision into the durable `.fable` state. |
| `gf_doctor` | Bounded diagnostics over the `.fable` state. `fix:true` performs one idempotent repair. |
| `gf_skills` | Registry of the bundled lifecycle skills with load state. |
| `gf_handoff` | Build a self-contained handoff document: durable state, active card, what remains, open ledger findings, and an explicit re-verify list. Read-only. |

## Lifecycle skills (17)

`get-fable` (orchestrator) + `fable-{discover, research, plan, tdd,
delegate, execute, verify, review, security, recover, release, handoff,
spark, architecture, config, prove-it}`. Each `SKILL.md` carries the
`name / description / inputs / requires / produces / gates / fallback /
neural_links` frontmatter the DSH skill registry reads. The catalog is the
single source of truth; `skills/registry.json` and the `skills/<id>/SKILL.md`
bodies are generated from it.

## Building

```sh
npm install        # dev dependencies only; no install-time build
npm run build      # tsdown: lib/index.js (host) + lib/client.js (web)
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run validate   # bundle shape + no-foreign-plugin-references invariant
```

`@deepseek-ai/*` are declared as optional peer dependencies, so they resolve
from the DSH host that loads the plugin rather than being bundled here.

There is **no `prepare` script**. `lib/` is committed and shipped in the
`files` list, so `dsh plugin add github:…` installs a working plugin with no
build step and no toolchain on the consumer's machine. Build locally only
when changing `src/`, then commit the regenerated `lib/`.

Two artifacts are produced:

- `lib/index.js` — ESM host entry; the `GfPolicy` Service is the default
  export. The host's cordis loader mounts it like any plugin.
- `lib/client.js` — CJS factory registered via
  `window.__ModuleLoader__.load({id, factory})`; the only shape the DSH
  client-module loader accepts. `react` is the sole runtime external.

## Installing into a profile

Three supported routes. Route 1 is the standard DSH path and the one to use
unless you are developing the plugin itself.

Requirements: DSH `>=0.2.1-rc.2` and Node `>=22`, both declared in
`package.json` under `dsh.engines.dsh` and `engines.node`.

`lib/` ships prebuilt and the manifest has **no** `prepare` script, so a git
install needs no build step. The package has **no runtime dependencies** —
`@deepseek-ai/*` are optional peers resolved from the DSH host that loads it.

### 1. Standard: `dsh plugin add` (git)

```sh
dsh plugin --profile web add github:mulqizamzam/mulqi-getfable
```

`dsh plugin` forwards the remaining arguments to the profile's package
manager. When the package operation succeeds, DSH reconciles the profile: a
dependency that declares `dsh.bundle.patch` in its manifest is activated
automatically. This package does declare one (`./cordis.patch.yml`), so the
entry lands in **both** `dependencies` and `dsh.profile.bundles`. There is
nothing to hand-edit afterwards.

Pin a revision when you want a reproducible install:

```sh
dsh plugin --profile web add github:mulqizamzam/mulqi-getfable#<commit-sha-or-tag>
```

### 2. Local checkout (plugin development)

```sh
dsh plugin --profile web add link:/absolute/path/to/mulqi-getfable
```

A `link:` spec points the profile at your working tree, so a rebuild is
picked up on the next session. Use this while iterating; switch to the git
spec for a stable install.

### 3. Manual manifest edit (no CLI)

If you are provisioning a profile by hand, edit the profile's `package.json`
(e.g. `~/.dsh/profiles/web/package.json`):

```jsonc
{
  "dependencies": {
    "mulqi-getfable": "github:mulqizamzam/mulqi-getfable#main"
  },
  "dsh": {
    "profile": {
      "bundles": ["mulqi-getfable"]
    }
  }
}
```

Then install with the profile's own package manager. Profiles created by DSH
use pnpm:

```sh
cd ~/.dsh/profiles/web
pnpm install
```

Both halves matter. A dependency without the matching `bundles` entry
installs the package but mounts nothing — no `gf_*` tools, no panel. That
second step is exactly what route 1 does for you.

### Verify

```sh
# the bundle layer resolves and mounts
dsh --profile web --dump-config | grep -A3 mulqi-getfable
```

In a fresh session `gf_status` returns `ok: true` with a `version` and
`phase`, and `gf_skills` lists the 17 lifecycle skills.

### Remove

```sh
dsh plugin --profile web remove mulqi-getfable
```

Removal drops the dependency, the bundle entry, and the installed tree in
one step. Do not delete the directory under `node_modules` by hand — that
leaves a dangling `bundles` entry the loader will fail to resolve.

### Not on npm

`mulqi-getfable` is not published to the npm registry — `npm view
mulqi-getfable` returns `404`. Install from git or from a local `link:`
spec; `npm install mulqi-getfable` will not resolve.

### Restart

The host mounts the service at load, so the new `gf_*` tools, the skill
catalog, and the Fable Hub panel appear only after a fresh session.

Web-only features (the Fable Hub panel and the settings card) require the
profile to include `@deepseek-ai/dsh-client-connection`; the host tools and
hooks work in any profile, including headless ones.

## Repository layout

```
src/
  core/        state, route, doctor, ledger, catalog, wire (pure, unit-tested)
  policy-service.ts   the Service (host)
  host/        host bundle entry (lib/index.js)
  client/      web client entry (lib/client.js)
skills/        registry.json + 17 generated SKILL.md
test/          vitest suites
lib/           built bundles (committed; no prepare script)
```

## License

MIT © Mulqizamzam. See [LICENSE](LICENSE).
