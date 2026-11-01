---
name: get-fable
description: "Orchestrate software engineering workflows across the canonical lifecycle with deterministic routing and evidence precedence. Use when starting a complex coding task, navigating lifecycle phases, resuming work with durable .fable state, or routing between research, planning, testing, verification, and recovery. Do NOT use when an individual specialist skill already has clear isolated ownership of a bounded subtask."
version: 1.0.0
pack: core
inputs:
  - task_description
  - current_state
requires:
  - repo_access
produces:
  - routing_decision
gates:
  - state_schema_valid
fallback: null
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-discover
    - fable-research
    - fable-plan
    - fable-tdd
    - fable-delegate
    - fable-execute
    - fable-verify
    - fable-review
    - fable-security
    - fable-recover
    - fable-release
    - fable-handoff
  lateral_peers:
    []
  recovery: null
---

# get-fable

Orchestrate software engineering workflows across the canonical lifecycle with deterministic routing and evidence precedence. Use when starting a complex coding task, navigating lifecycle phases, resuming work with durable .fable state, or routing between research, planning, testing, verification, and recovery. Do NOT use when an individual specialist skill already has clear isolated ownership of a bounded subtask.

## Activate When
- fable
- lifecycle
- orchestration
- routing

## Inputs
- task_description
- current_state

## Produces
- routing_decision

## Gates
- state_schema_valid

## Next
- fable-discover
- fable-research
- fable-plan
- fable-tdd
- fable-delegate
- fable-execute
- fable-verify
- fable-review
- fable-security
- fable-recover
- fable-release
- fable-handoff

## Fallback
- (none - top of the lifecycle)
