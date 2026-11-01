---
name: fable-architecture
description: "Evaluate architectural triggers (scale, concurrency, domain decoupling, resource intensity) and lock out monolithic scaffolding when a distributed paradigm is warranted. Use at inception when a spec crosses scale or decoupling thresholds."
version: 1.0.0
pack: design
inputs:
  - spec
requires:
  - spec_present
produces:
  - architecture_decision
gates:
  - scale_evaluated
  - domain_evaluated
fallback: fable-plan
mutatesWorkspace: false
parallelSafe: false
neural_links:
  precursors:
    []
  continuations:
    - fable-plan
  lateral_peers:
    []
  recovery: fable-plan
---

# fable-architecture

Evaluate architectural triggers (scale, concurrency, domain decoupling, resource intensity) and lock out monolithic scaffolding when a distributed paradigm is warranted. Use at inception when a spec crosses scale or decoupling thresholds.

## Activate When
- architecture
- microservice
- scale
- concurrency

## Inputs
- spec

## Produces
- architecture_decision

## Gates
- scale_evaluated
- domain_evaluated

## Next
- fable-plan

## Fallback
- fable-plan
