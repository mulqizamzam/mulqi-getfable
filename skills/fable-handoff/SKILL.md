---
name: fable-handoff
description: "Produce a complete, self-contained handoff so another session or agent can resume: durable state, the active card, open findings, and what must be re-verified. Use when work moves to another session or agent."
version: 1.0.0
pack: core
inputs:
  - durable_state
  - active_card
requires:
  - state_complete
produces:
  - handoff_document
gates:
  - self_contained
fallback: fable-recover
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    []
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-handoff

Produce a complete, self-contained handoff so another session or agent can resume: durable state, the active card, open findings, and what must be re-verified. Use when work moves to another session or agent.

## Activate When
- handoff
- resume
- continue

## Inputs
- durable_state
- active_card

## Produces
- handoff_document

## Gates
- self_contained

## Next
- (terminal)

## Fallback
- fable-recover
