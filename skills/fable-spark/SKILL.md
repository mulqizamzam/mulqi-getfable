---
name: fable-spark
description: "Suggest the single next atomic move inside active work when the route is unclear. Use at a session boundary or when the operator asks what to do next without re-running the whole router."
version: 1.0.0
pack: intelligence
inputs:
  - current_state
requires:
  - durable_state
produces:
  - next_move
gates:
  []
fallback: get-fable
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-execute
  lateral_peers:
    []
  recovery: get-fable
---

# fable-spark

Suggest the single next atomic move inside active work when the route is unclear. Use at a session boundary or when the operator asks what to do next without re-running the whole router.

## Activate When
- spark
- next
- hint

## Inputs
- current_state

## Produces
- next_move

## Gates
- (none)

## Next
- fable-execute

## Fallback
- get-fable
