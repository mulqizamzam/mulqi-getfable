---
name: fable-review
description: "Perform an independent, evidence-grounded review of git diffs against requested specifications, architectural invariants, and code standards. Use when a diff needs a correctness pass by a fresh reviewer."
version: 1.0.0
pack: core
inputs:
  - diff
  - spec
requires:
  - diff_available
produces:
  - review_findings
gates:
  - independent_reviewer
fallback: fable-execute
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-release
  lateral_peers:
    []
  recovery: fable-execute
---

# fable-review

Perform an independent, evidence-grounded review of git diffs against requested specifications, architectural invariants, and code standards. Use when a diff needs a correctness pass by a fresh reviewer.

## Activate When
- review
- diff
- correctness

## Inputs
- diff
- spec

## Produces
- review_findings

## Gates
- independent_reviewer

## Next
- fable-release

## Fallback
- fable-execute
