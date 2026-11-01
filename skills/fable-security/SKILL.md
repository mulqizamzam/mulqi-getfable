---
name: fable-security
description: "Conduct threat modeling, vulnerability assessment, secret sanitization, and security review across trust boundaries, auth flows, and untrusted inputs. Use when the task touches a trust boundary, secret, credential, or authorization check."
version: 1.0.0
pack: core
inputs:
  - trust_boundary
  - diff
requires:
  - threat_model
produces:
  - security_findings
  - sanitized_secrets
gates:
  - boundary_map
  - no_secret_exposure
fallback: fable-recover
mutatesWorkspace: false
parallelSafe: false
neural_links:
  precursors:
    []
  continuations:
    - fable-verify
    - fable-release
  lateral_peers:
    []
  recovery: fable-recover
---

# fable-security

Conduct threat modeling, vulnerability assessment, secret sanitization, and security review across trust boundaries, auth flows, and untrusted inputs. Use when the task touches a trust boundary, secret, credential, or authorization check.

## Activate When
- security
- vulnerability
- secret
- trust-boundary
- authz

## Inputs
- trust_boundary
- diff

## Produces
- security_findings
- sanitized_secrets

## Gates
- boundary_map
- no_secret_exposure

## Next
- fable-verify
- fable-release

## Fallback
- fable-recover
