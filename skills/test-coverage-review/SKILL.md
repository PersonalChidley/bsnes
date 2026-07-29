---
name: test-coverage-review
description: Review automated test coverage by mapping important behavior, recent changes, failure risk, and architecture boundaries to concrete test evidence. Use for test-gap audits, regression-suite planning, confidence reviews before change or release, or adding focused tests for identified gaps. Do not use to chase a coverage percentage, replace exploratory testing, or perform a broad repository health review.
---

# Test Coverage Review

Produce a risk-ranked map from important behavior to existing test evidence and
the smallest valuable additions. Optimize for defect detection and confidence,
not line-count optics.

## Select the mode

- Use **assess** to report coverage evidence and gaps without editing.
- Use **strengthen** when the user authorizes adding or updating tests.
- Use **change-focused** for a specified diff, feature, regression, or release.

Default to `assess` when edit authorization is unclear.

## Establish inputs

- Read repository instructions and test conventions.
- Identify supported test commands, frameworks, fixtures, and coverage tools.
- Inspect version-control status and distinguish current work from the review.
- Determine the requested scope, critical user journeys, recent changes, and
  known incidents.
- Treat numeric coverage reports as one input only; proceed from source and
  test evidence when instrumentation is unavailable.

## Preserve boundaries

- Do not modify production behavior merely to make a test easy. Extract only
  the smallest reasonable seam when implementation is authorized.
- Do not assert internal details when stable observable behavior is available.
- Do not add broad snapshots or low-value permutations to inflate counts.
- Preserve test isolation; do not call live production services or mutate live
  data.
- Do not weaken assertions, skip tests, or hide flakes to obtain a green run.
- Recommend security, performance, or architecture specialist review when the
  issue exceeds testing scope.

## Run the workflow

### 1. Inventory behavior and evidence

Map scoped behavior across:

- public and authenticated entry points;
- validation, authorization, and tenant boundaries;
- domain rules and edge cases;
- persistence and external-service boundaries;
- failure, retry, concurrency, and recovery paths; and
- accessibility or client interaction where applicable.

For each behavior, locate unit, integration, route/action, component, and
end-to-end evidence. Confirm that tests execute meaningful assertions rather
than merely import or render code.

### 2. Rank risk

Rank gaps using consequence, change frequency, defect history, reach, and the
chance that a failure escapes existing tests. Give highest weight to:

- authorization and privacy boundaries;
- money, destructive writes, migrations, and irreversible workflows;
- time, recurrence, ordering, and concurrency logic;
- public contracts and cross-surface consistency;
- error handling and provider failure behavior; and
- regressions related to current changes.

Label inferred risk separately from reproduced defects.

### 3. Design the smallest useful tests

For every material gap, specify:

- behavior and failure prevented;
- appropriate test level;
- observable assertion;
- fixtures, mocks, and boundary cases;
- likely file location; and
- dependencies or seams needed.

Prefer a few representative equivalence classes and boundaries over exhaustive
combinations. Pin regressions with a focused failing test before fixing them
when implementation is in scope.

### 4. Add authorized tests

In `strengthen` mode, follow existing patterns and keep each new test
deterministic, isolated, readable, and focused. Avoid unrelated production
refactors. If a genuine defect is revealed, report it; do not silently fix
production code unless the user authorized remediation.

### 5. Validate

- Run the narrowest affected test target first.
- Run the repository's broader test command when practical.
- Run type checking and linting when tests or seams changed.
- Check for accidental focus markers, skips, leaked timers, shared state, and
  over-broad mocks.
- Inspect the final diff and report failures or environmental limits honestly.

## Deliverable

Report:

1. scoped behavior-to-test map;
2. strengths already covered;
3. risk-ranked gaps with evidence and confidence;
4. tests added or a concrete test plan;
5. defects discovered separately from coverage gaps; and
6. commands run, results, and remaining limitations.

## Completion criteria

- Important scoped behavior is mapped to actual test evidence.
- Recommendations are prioritized by risk rather than raw percentage.
- Added tests fail for the intended reason when applicable and pass after the
  authorized change.
- No test weakens or obscures existing guarantees.
- Remaining gaps and unavailable validation are explicit.
