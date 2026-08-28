---
name: improve
description: Assess or improve the bsnes web port through an evidence-backed maintenance loop that inspects governance and docs/improvement-backlog.md, selects the highest-value risk, makes a scoped fix when authorized, validates it with lint, typecheck, and build, and records the result. Use for "/improve", repository health checks, pre-deploy maintenance, "what should we fix next", or recurring improvement work on the browser shell and its WebAssembly core boundary. Do not use to rewrite emulation logic in TypeScript, and do not use for a deep security, performance, documentation, or test-only audit when the corresponding specialist skill is the better fit.
---

# Improve

Run one disciplined improvement iteration or produce a read-only repository
health assessment. Use repository evidence and governance instead of carrying
assumptions from one project into another.

## Select the mode

- Use **loop** when the user asks to improve, fix, or run the maintenance loop.
- Use **assess** when the user asks to review, report, or check one repository.
- Use **portfolio** for a read-only comparison of two or more repositories.

Treat a review request as read-only. In ambiguous cases, infer the mode from
the requested outcome; do not turn an assessment into edits.

## Establish context

1. Read the root and applicable nested agent instructions.
2. Inspect version-control status and preserve unrelated work.
3. Locate the repository's backlog, manifests, architecture guidance,
   validation commands, release policy, and generated or reference-only paths.
4. For a repository with a maintained profile, read
   [references/repository-profiles.md](references/repository-profiles.md).
   Treat the repository's current instructions and manifests as authoritative
   if a profile has drifted.
5. Exclude dependencies, caches, build output, local environments, credential
   stores, reports, and generated files unless the request specifically puts
   them in scope.

## Preserve boundaries

- Keep product policy, architecture, authorization, and live-system decisions
  with the user or their documented owner.
- Do not commit, push, publish, deploy, migrate shared data, provision
  infrastructure, or contact external services unless explicitly authorized.
- Never read or print secret values. Inspect only names, safe examples, and
  code paths needed to verify secret handling.
- Do not transfer framework assumptions between repositories. The workspace
  contains different auth versions, database libraries, rendering models, test
  runners, and deployment boundaries.
- Keep default tests offline. Never point browser or integration tests at a
  production database or tenant.
- Before running any validation command, determine whether it writes generated
  artifacts, loads live local configuration, starts services, or can contact a
  provider. In assess and portfolio modes, prefer safe offline checks and
  report intentionally skipped builds or integrations rather than broadening
  the review's effects.
- Distinguish a verified defect from a risk, inference, or improvement idea.

## Loop mode

### 1. Orient

- Read the backlog before choosing work.
- Run the repository's required baseline checks when practical. If the
  baseline is already broken, determine whether the failure is in scope and
  whether it predates the session.
- Identify the least recently reviewed focus area unless the user named one.

### 2. Scan one focus area

Choose one coherent lens:

- security and privacy;
- correctness and data integrity;
- tests and reproducibility;
- reliability and failure handling;
- performance and operability;
- documentation and cross-surface alignment; or
- foundations such as auth, data access, release mechanics, and CI.

Read the relevant section of
[references/review-checklist.md](references/review-checklist.md) for a deeper
pass. Add only evidence-backed findings to the backlog and order them by
impact, urgency, and dependencies.

### 3. Fix a reviewable unit

- Address actionable High items first, then the best-supported Medium item.
- Keep the patch small enough to attribute and review.
- Add a focused regression test for every bug fix or behavior change. If code
  is hard to test, extract the smallest import-safe seam rather than moving
  policy or weakening boundaries.
- Preserve public contracts, authorization, accessibility, time zones,
  ordering, money precision, and external failure behavior.
- Stop for direction when the change would decide policy, alter live data, or
  expand the requested scope materially.

### 4. Validate

- Run the narrowest relevant test first, then the repository's required
  lint/type/build/test gates in the order prescribed by its instructions.
- Reproduce the original failure or acceptance condition where practical.
- Inspect the final diff for unrelated changes, generated artifacts, secrets,
  weakened checks, and accidental behavior changes.
- Report skipped, unavailable, pre-existing, and failed checks honestly.
- Run `$coding-ninja` checkpoint mode after the focused validation so verified
  lessons improve the relevant canonical skills before the next loop unit.

### 5. Record

- Update the repository's established backlog with the completed outcome,
  date, evidence, validation, and remaining work.
- Update canonical and required mirrored guidance only when conventions or
  current behavior changed.
- Use `$documentation-sync` for non-trivial documentation reconciliation.
- Use `$version-bump` only when the user requested a release.

## Assess mode

1. Build a current-state map of source, tests, data boundaries, automation,
   documentation, decisions, and generated artifacts.
2. Read [references/review-checklist.md](references/review-checklist.md) and
   apply each relevant lens at triage depth.
3. Capture material findings with repository-relative evidence, consequence,
   confidence, a proposed outcome, and any specialist review needed.
4. Deduplicate by outcome and prioritize using
   [references/output-contracts.md](references/output-contracts.md).
5. Report strengths as well as weaknesses. Do not invent numeric coverage,
   performance, or health scores.

Use the specialist skill instead when depth is the primary goal:

- `$security-review` for threat and trust-boundary analysis;
- `$performance-review` for measurement and optimization;
- `$test-coverage-review` for behavior-to-test mapping; and
- `$documentation-sync` for claim-by-claim documentation reconciliation.

## Portfolio mode

1. Establish the same scope and evidence standard for every repository.
2. Assess each repository independently before comparing it with siblings.
3. Normalize findings by outcome and consequence, not by framework or raw
   issue count.
4. Identify genuinely shared risks, reusable practices, and inconsistent
   policies only when direct evidence supports the comparison.
5. Keep repository-specific backlogs separate. Produce a workspace priority
   view without silently writing findings into every source repository.
6. Treat full baselines as optional evidence at triage depth. Run only checks
   confirmed safe for the local environment and list every skipped gate per
   repository.

## Deliverable

For loop mode, report the focus area, issue fixed, evidence, files changed,
checks run, backlog updates, and next recommended focus.

For assess or portfolio mode, use the health-report contract in
[references/output-contracts.md](references/output-contracts.md), including
scope, strengths, prioritized risks, highest-value next work, validation, and
limitations.

## Completion criteria

- The selected mode and authorization boundary were respected.
- Findings and changes are traceable to repository evidence.
- Behavior changes have focused regression coverage.
- Required checks passed or their exact limitations are reported.
- Loop-mode backlog and affected canonical guidance reflect the result.
- Portfolio conclusions preserve meaningful repository differences.

## Resources

- [references/repository-profiles.md](references/repository-profiles.md) —
  dispatch facts and fragile boundaries for reviewed repositories.
- [references/review-checklist.md](references/review-checklist.md) — the
  multi-lens audit checklist.
- [references/output-contracts.md](references/output-contracts.md) — backlog
  and health-report contracts.
