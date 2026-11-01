---
name: fable-prove-it
description: "Produce a minimal, runnable proof for a specific claim: a command, a diff, a round-trip, or a measured value. Use when the operator needs one concrete piece of evidence, not a full verification pass."
version: 1.0.0
pack: core
inputs:
  - claim
requires:
  - claim_falsifiable
produces:
  - proof_artifact
gates:
  - fresh_evidence
fallback: fable-verify
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-verify
  lateral_peers:
    []
  recovery: fable-verify
---

# fable-prove-it

Produce a minimal, runnable proof for a specific claim: a command, a diff, a round-trip, or a measured value. Use when the operator needs one concrete piece of evidence, not a full verification pass.

## Activate When
- prove
- evidence
- demo

## Inputs
- claim

## Produces
- proof_artifact

## Gates
- fresh_evidence

## Next
- fable-verify

## Fallback
- fable-verify
