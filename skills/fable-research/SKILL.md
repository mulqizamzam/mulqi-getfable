---
name: fable-research
description: "Resolve current external facts, official documentation, library behaviour, and API contracts against primary sources before implementation. Use when a third-party dependency or external service is uncertain."
version: 1.0.0
pack: core
inputs:
  - research_question
requires:
  - network_or_docs
produces:
  - external_facts
  - api_contract
gates:
  - primary_source_cited
fallback: fable-recover
mutatesWorkspace: false
parallelSafe: true
neural_links:
  precursors:
    []
  continuations:
    - fable-plan
    - fable-tdd
    - fable-execute
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-research

Resolve current external facts, official documentation, library behaviour, and API contracts against primary sources before implementation. Use when a third-party dependency or external service is uncertain.

## Activate When
- research
- api
- documentation
- external

## Inputs
- research_question

## Produces
- external_facts
- api_contract

## Gates
- primary_source_cited

## Next
- fable-plan
- fable-tdd
- fable-execute

## Fallback
- fable-recover
