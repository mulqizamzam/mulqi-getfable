---
name: fable-verify
description: "Falsify implementations and gather fresh, machine-checked acceptance proof across tests, builds, typechecks, and runtime smoke checks before completion. Use when a claim must be proven, not assumed."
version: 1.0.0
pack: core
inputs:
  - implementation
  - acceptance_contract
requires:
  - test_harness
produces:
  - verification_evidence
gates:
  - fresh_evidence
  - machine_checked
fallback: fable-recover
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-review
    - fable-release
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-verify

Falsify implementations and gather fresh, machine-checked acceptance proof across tests, builds, typechecks, and runtime smoke checks before completion. Use when a claim must be proven, not assumed.

## Activate When
- verify
- falsify
- test
- smoke

## Inputs
- implementation
- acceptance_contract

## Produces
- verification_evidence

## Gates
- fresh_evidence
- machine_checked

## Next
- fable-review
- fable-release

## Fallback
- fable-recover
