# Design decisions

Where this rebuild diverges from the observed upstream behaviour, and why:

- **No upstream CLI / Bun toolchain.** The upstream ships a global CLI and a
  multi-host adapter matrix (32 host targets). This rebuild exposes the same
  discipline through DSH-native primitives — a cordis service, tools, event
  hooks, and the web client slots — so it runs inside an existing DSH profile
  without a second runtime or a second skill registry.
- **17 lifecycle skills in the catalog, not 42.** The registry ships
  exactly 17 entries: `get-fable` (the orchestrator) plus 16 specialists
  (`fable-discover`, `fable-research`, `fable-plan`, `fable-tdd`,
  `fable-delegate`, `fable-execute`, `fable-verify`, `fable-review`,
  `fable-security`, `fable-recover`, `fable-release`, `fable-handoff`,
  `fable-spark`, `fable-architecture`, `fable-config`, `fable-prove-it`).
  The parity checklist (M10) words this as "16 SKILL.md" because it counts
  `get-fable` + 15 specialists; the shipped set is the superset with
  `fable-prove-it` as the 16th specialist. That is a deliberate, recorded
  difference, not an off-by-one: the dashboard and `gf_skills` read
  `skills/registry.json`, so the count shown is always the truth.
  The remaining upstream consumer skills (dataviz, cowork, loop, run, memory,
  simplify, ...) are out of scope — named in the parity checklist as O4, not a
  silent cut.
- **RPC channels instead of REST.** The upstream web UI talks to
  `/api/fable/*` over HTTP. Here the dashboard talks to the host over the two
  loopback-fenced channels `/mulqi-gf-read` and `/mulqi-gf-write`; there is no
  plugin-owned HTTP route and no token.
- **Read-only skill provider.** The skill catalog is registered as a bundled,
  read-only provider on `ctx.skills`; the registry and loader stay owned by the
  host. Skill bodies are generated from a single `skills/registry.json`
  source of truth so the catalog and the on-disk `SKILL.md` files can never
  disagree.
- **Fail-open hooks.** Every lifecycle hook is wrapped so a helper error never
  throws into the host session; a *malformed project* state is surfaced to the
  doctor instead of being raised.
