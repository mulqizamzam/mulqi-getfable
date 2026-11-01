---
name: fable-discover
description: "Gather the smallest set of repository, environment, documentation, and runtime evidence needed before planning or changing code. Use when the repository layout, build system, entry points, or runtime behaviour is unknown."
version: 1.0.0
pack: core
inputs:
  - exploration_intent
requires:
  - repo_access
produces:
  - repository_evidence
  - environment_facts
gates:
  - load_bearing_unknowns_resolved
fallback: fable-recover
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-research
    - fable-plan
    - fable-tdd
    - fable-execute
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-discover

Gather the smallest set of repository, environment, documentation, and runtime evidence needed before planning or changing code. Use when the repository layout, build system, entry points, or runtime behaviour is unknown.

## Activate When
- discover
- inspect
- trace
- repository

## Inputs
- exploration_intent

## Produces
- repository_evidence
- environment_facts

## Gates
- load_bearing_unknowns_resolved

## Next
- fable-research
- fable-plan
- fable-tdd
- fable-execute

## Fallback
- fable-recover
