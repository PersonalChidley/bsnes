---
name: security-review
description: Perform an evidence-backed security review of a software repository by modeling assets, actors, trust boundaries, entry points, data flows, and abuse cases, then verifying exploitable or defense-in-depth findings. Use for deep application-security audits, auth and tenant-isolation reviews, upload or SSRF reviews, secret and configuration reviews, or security-focused change assessment. Do not use for penetration testing live systems without explicit authorization or for a broad repository health review.
---

# Security Review

Identify credible security risks, explain their attack paths and impact, and
prioritize proportionate remediation. Prefer verified findings over scanner
volume.

## Select the mode

- Use **review** for a read-only repository assessment.
- Use **change-focused** for a specified diff, feature, endpoint, or data flow.
- Use **remediate** only when the user explicitly authorizes security fixes.

Default to `review`. Repository access never implies authorization to probe
deployed systems, third parties, or accounts.

## Establish inputs

- Read repository governance, security policy, architecture decisions, and
  applicable nested instructions.
- Inspect version-control status and preserve unrelated work.
- Identify application type, deployment boundary, identities, tenants,
  privileged roles, sensitive assets, trust boundaries, and public entry
  points.
- Discover security-relevant validation commands and dependency tooling.
- Record scope exclusions and environmental limitations before assigning
  confidence.

## Preserve boundaries

- Keep all testing non-destructive and local unless the user explicitly
  authorizes a precise external target and method.
- Never expose, copy, rotate, or validate real secrets by printing them.
- Do not submit payloads to production, bypass access controls, create
  persistence, or test third-party infrastructure.
- Do not treat dependency version matches, pattern searches, or theoretical
  concerns as confirmed vulnerabilities without tracing reachability.
- Do not change authentication, authorization, encryption, retention, or
  security policy based on an unresolved product decision.
- Preserve existing work and avoid opportunistic refactors.

## Run the workflow

### 1. Build the threat model

Document assets, actors, privileges, tenant boundaries, data stores, external
services, entry points, and data flows. Mark where untrusted data crosses into
privileged code or sensitive output.

### 2. Trace controls end to end

Inspect applicable areas:

- authentication, session handling, and account recovery;
- authorization, object ownership, tenant and role scoping;
- input validation, output encoding, injection, and unsafe HTML;
- CSRF, CORS, framing, redirects, and browser security boundaries;
- uploads, object storage, content validation, and download authorization;
- SSRF, webhook signatures, callback URLs, and provider-bound requests;
- secret handling, environment configuration, logging, and error disclosure;
- dependency and supply-chain reachability;
- rate limiting, replay, idempotency, concurrency, and abuse resistance; and
- data minimization, retention, deletion, backups, and sensitive AI/provider
  flows.

Trace from entry point to sink and through every enforcement boundary. Check
both read and write paths, including indirect references supplied by clients.

### 3. Verify findings

For each candidate, capture:

- affected asset and attacker prerequisites;
- concrete source-to-sink or authorization path;
- existing mitigating controls;
- safe local reproduction or code-level proof;
- impact and scope;
- confidence and assumptions; and
- remediation outcome plus a focused regression test.

Use severity from realistic likelihood and impact. Reserve Critical and High
for credible, reachable paths; label defense-in-depth opportunities clearly.

### 4. Apply authorized remediation

In `remediate` mode, fix the enforcement boundary rather than only the visible
caller. Add or update a focused regression test for each behavior change. Keep
patches narrow, preserve public contracts where safe, and avoid revealing
exploit details in anonymous error responses.

Stop and request direction before changes that alter security policy, user
access, data retention, live credentials, or external systems.

### 5. Validate

- Run focused exploit-regression tests, then relevant broader checks.
- Run supported static, dependency, lint, and type checks as appropriate.
- Re-trace bypass variants and sibling entry points after a fix.
- Inspect the diff for new data exposure, weaker defaults, or missing guards.
- Report tool limits, false-positive analysis, and untested assumptions.

## Deliverable

Report:

1. scope, threat model, and exclusions;
2. verified findings ordered by severity, each with evidence, attack path,
   impact, confidence, and remediation;
3. defense-in-depth observations in a separate section;
4. fixes and regression tests added, if authorized; and
5. validation results and residual risk.

Avoid publishing weaponized reproduction details when a concise proof is
sufficient for maintainers.

## Completion criteria

- Trust boundaries and sensitive assets are explicit.
- Every reported vulnerability has a plausible reachable path and evidence.
- Severity reflects both likelihood and impact.
- Remediation, when authorized, is enforced at the correct boundary and tested.
- External testing stayed within explicit authorization.
