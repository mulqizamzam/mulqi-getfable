---
name: fable-execute
description: "Implement one accepted, bounded work card with immediate local verification, invariant preservation, and zero scope drift. Use when a single card is ready to be built."
version: 1.0.0
pack: core
inputs:
  - work_card
requires:
  - acceptance_contract
produces:
  - implementation
  - local_verification
gates:
  - invariants_preserved
  - no_scope_drift
fallback: fable-recover
mutatesWorkspace: true
parallelSafe: false
neural_links:
  precursors:
    []
  continuations:
    - fable-verify
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-execute

Implement one accepted, bounded work card with immediate local verification, invariant preservation, and zero scope drift. Use when a single card is ready to be built.

## Activate When
- execute
- implement
- build

## Inputs
- work_card

## Produces
- implementation
- local_verification

## Gates
- invariants_preserved
- no_scope_drift

## Next
- fable-verify

## Fallback
- fable-recover
