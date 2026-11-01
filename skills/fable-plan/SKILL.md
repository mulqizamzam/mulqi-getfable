---
name: fable-plan
description: "Convert discovery evidence into bounded, testable work cards with explicit acceptance criteria and architectural invariants. Use when architecture, decomposition, or contract choice is the load-bearing decision."
version: 1.0.0
pack: core
inputs:
  - evidence_set
requires:
  - repository_evidence
produces:
  - work_cards
  - architectural_invariants
gates:
  - cards_bounded
  - acceptance_explicit
fallback: fable-recover
mutatesWorkspace: false
parallelSafe: false
neural_links:
  precursors:
    []
  continuations:
    - fable-tdd
    - fable-delegate
    - fable-execute
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-plan

Convert discovery evidence into bounded, testable work cards with explicit acceptance criteria and architectural invariants. Use when architecture, decomposition, or contract choice is the load-bearing decision.

## Activate When
- plan
- architect
- decompose
- contract

## Inputs
- evidence_set

## Produces
- work_cards
- architectural_invariants

## Gates
- cards_bounded
- acceptance_explicit

## Next
- fable-tdd
- fable-delegate
- fable-execute

## Fallback
- fable-recover
