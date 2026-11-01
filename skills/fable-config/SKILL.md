---
name: fable-config
description: "Read and reason about the project configuration surface (toolchain, build flags, environment) before changing it. Use when a task depends on build or runtime configuration and the current values are unknown."
version: 1.0.0
pack: system
inputs:
  - config_intent
requires:
  - repo_access
produces:
  - config_facts
gates:
  []
fallback: fable-discover
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-plan
  lateral_peers:
    []
  recovery: fable-discover
---

# fable-config

Read and reason about the project configuration surface (toolchain, build flags, environment) before changing it. Use when a task depends on build or runtime configuration and the current values are unknown.

## Activate When
- config
- toolchain
- environment

## Inputs
- config_intent

## Produces
- config_facts

## Gates
- (none)

## Next
- fable-plan

## Fallback
- fable-discover
