# Provenance

`mulqi-getfable` is an original, standalone DeepSeek Harness plugin. It is a
DSH-native implementation of a coding-lifecycle discipline: a durable
`.fable/` state machine, deterministic routing precedence, mutation-aware
verification, a bounded doctor, and a bundled skill catalog.

Nothing in this repository refers to, depends on, or redistributes any other
project. The shipped runtime surface (`lib/`, `skills/`, `src/`, and the root
manifest) is scanned on every build by `scripts/validate-bundle.mjs`.

Design decisions that differ from a general-purpose lifecycle model are
recorded in `DESIGN.md`.
