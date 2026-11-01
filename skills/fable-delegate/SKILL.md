---
name: fable-delegate
description: "Delegate independent bounded subtasks to parallel workers with strict disjoint ownership and explicit acceptance contracts. Use when genuinely independent cards can run without shared state."
version: 1.0.0
pack: core
inputs:
  - independent_cards
requires:
  - cards_bounded
produces:
  - delegation_plan
  - disjoint_ownership
gates:
  - no_shared_state
  - ownership_disjoint
fallback: fable-execute
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-verify
  lateral_peers:
    []
  recovery: fable-execute
---

# fable-delegate

Delegate independent bounded subtasks to parallel workers with strict disjoint ownership and explicit acceptance contracts. Use when genuinely independent cards can run without shared state.

## Activate When
- delegate
- parallel
- fan-out
- disjoint

## Inputs
- independent_cards

## Produces
- delegation_plan
- disjoint_ownership

## Gates
- no_shared_state
- ownership_disjoint

## Next
- fable-verify

## Fallback
- fable-execute
