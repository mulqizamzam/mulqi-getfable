---
name: fable-recover
description: "Diagnose repeated or contradictory failures by proving the execution path before touching product logic, then record a revised hypothesis. Use when two consecutive failures have moved the workflow into recovering."
version: 1.0.0
pack: core
inputs:
  - failure_evidence
  - hypothesis
requires:
  - failure_log
produces:
  - revised_hypothesis
  - path_proof
gates:
  - harness_proven
  - execution_path_proven
fallback: fable-discover
mutatesWorkspace: false
parallelSafe: false
neural_links:
  precursors:
    []
  continuations:
    - fable-tdd
    - fable-execute
  lateral_peers:
    []
  recovery: fable-discover
---

# fable-recover

Diagnose repeated or contradictory failures by proving the execution path before touching product logic, then record a revised hypothesis. Use when two consecutive failures have moved the workflow into recovering.

## Activate When
- recover
- diagnose
- failure
- hypothesis

## Inputs
- failure_evidence
- hypothesis

## Produces
- revised_hypothesis
- path_proof

## Gates
- harness_proven
- execution_path_proven

## Next
- fable-tdd
- fable-execute

## Fallback
- fable-discover
