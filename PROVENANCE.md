# Provenance

`mulqi-getfable` is an original, standalone DeepSeek Harness plugin. It was
produced by examining the published behaviour of the
`imMamdouhaboammar/get-fable` project (its coding-lifecycle discipline, the
`.fable/` durable state machine, deterministic routing precedence, and the
mutation-aware verification model), then rebuilding that observed behaviour as
DSH-native code.

**The link is deliberately broken:** this repository shares no code, no
author attribution, no distribution channel, and no runtime dependency with
the upstream project. The upstream name is recorded here only as the provenance
source of the observed behaviour; nothing in the shipped runtime surface
(`lib/`, `skills/`, `src/`, root manifest) references it, and
`scripts/validate-bundle.mjs` enforces that invariant on every build.

Design decisions are recorded in `DESIGN.md` where they diverge from observed
behaviour.
