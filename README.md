# mulqi-getfable

A portable coding-lifecycle discipline for **DeepSeek Harness (DSH)**:
deterministic routing across 17 bundled lifecycle skills, a durable `.fable/`
state machine, mutation-aware verification, a bounded doctor, and a
DSH-native web dashboard.

Everything here is a DSH-native mechanism: one cordis service, four tools,
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
| Tools | `gf_status`, `gf_route` (preview or apply), `gf_doctor` (diagnose or repair), `gf_skills` (registry) |
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
npm install        # prepares the bundle (see the `prepare` script)
npm run build      # tsdown: lib/index.js (host) + lib/client.js (web)
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run validate   # bundle shape + no-foreign-plugin-references invariant
```

`@deepseek-ai/*` are declared as optional peer dependencies, so they resolve
from the DSH host that loads the plugin rather than being bundled here. The
`prepare` script runs the same `tsdown` build, which is why a `git+https`
install produces `lib/` even though the build output is not committed.

Two artifacts are produced:

- `lib/index.js` — ESM host entry; the `GfPolicy` Service is the default
  export. The host's cordis loader mounts it like any plugin.
- `lib/client.js` — CJS factory registered via
  `window.__ModuleLoader__.load({id, factory})`; the only shape the DSH
  client-module loader accepts. `react` is the sole runtime external.

## Installing into a profile

The plugin is not installed into any profile from this repository. To adopt
it, point a profile at this package and declare it as a bundle.

**1. Add the dependency.** In the target profile's `package.json`
(e.g. `~/.dsh/profiles/web/package.json`):

```jsonc
{
  "dependencies": {
    "mulqi-getfable": "link:/mnt/d/Project/mulqi-getfable"
  }
}
```

Use `link:<absolute-path>` for a local checkout, or install from git if the
repo is published:

```jsonc
{
  "dependencies": {
    "mulqi-getfable": "github:mulqizamzam/mulqi-getfable#main"
  }
}
```

**2. Declare the bundle.** In the same `package.json`, tell the profile
loader to mount the bundle patch (`cordis.patch.yml`):

```jsonc
{
  "dsh": {
    "profile": {
      "bundles": ["mulqi-getfable"]
    }
  }
}
```

**3. Install and verify.**

```sh
# from the profile directory
npm install

# confirm the bundle entry id appears
dsh --profile web --dump-config | grep -A3 'mulqi-getfable'
```

**4. Restart the session.** The host mounts the service at load, so the
new `gf_*` tools, the skill catalog, and the Fable Hub panel appear only
after a fresh session.

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
lib/           built bundles (gitignored)
```

## License

MIT © Mulqizamzam. See [LICENSE](LICENSE).
