---
name: fable-release
description: "Decide distribution readiness: a candidate is releasable only with fresh, machine-checked evidence matching the current mutation generation. Use when a candidate is ready for a ship / tag / deploy decision."
version: 1.0.0
pack: core
inputs:
  - candidate
  - evidence
requires:
  - verification_evidence
produces:
  - release_decision
gates:
  - evidence_current_generation
fallback: fable-verify
mutatesWorkspace: false
parallelSafe: false
neural_links:
  precursors:
    []
  continuations:
    - fable-handoff
  lateral_peers:
    []
  recovery: fable-verify
---

# fable-release

Decide distribution readiness: a candidate is releasable only with fresh, machine-checked evidence matching the current mutation generation. Use when a candidate is ready for a ship / tag / deploy decision.

## Activate When
- release
- ship
- deploy
- distribution

## Inputs
- candidate
- evidence

## Produces
- release_decision

## Gates
- evidence_current_generation

## Next
- fable-handoff

## Fallback
- fable-verify
