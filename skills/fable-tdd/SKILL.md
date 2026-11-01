---
name: fable-tdd
description: "Drive testable behaviour changes and bug fixes through disciplined red-green-refactor cycles with observable regression tests. Use when the next step is a testable behaviour change."
version: 1.0.0
pack: core
inputs:
  - work_card
requires:
  - test_harness
produces:
  - failing_test
  - passing_implementation
  - regression_test
gates:
  - red_observed
  - green_observed
fallback: fable-recover
mutatesWorkspace: true
parallelSafe: false
neural_links:
  precursors:
    []
  continuations:
    - fable-verify
    - fable-review
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-tdd

Drive testable behaviour changes and bug fixes through disciplined red-green-refactor cycles with observable regression tests. Use when the next step is a testable behaviour change.

## Activate When
- tdd
- bug
- regression
- red-green-refactor

## Inputs
- work_card

## Produces
- failing_test
- passing_implementation
- regression_test

## Gates
- red_observed
- green_observed

## Next
- fable-verify
- fable-review

## Fallback
- fable-recover
