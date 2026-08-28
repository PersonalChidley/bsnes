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

Follow the [shared review conventions](../improve/references/review-conventions.md)
for mode selection, evidence and honest reporting, and preservation of unrelated
work. The boundaries below are specific to test-coverage review.

- Do not modify production behavior merely to make a test easy. Extract only
  the smallest reasonable seam when implementation is authorized.
- Do not assert internal details when stable observable behavior is available.
- When pinning semantic prose or Markdown, normalize insignificant whitespace;
  line wrapping is not behavior.
- Do not add broad snapshots or low-value permutations to inflate counts.
- Preserve test isolation; do not call live production services or mutate live
  data.
- Do not weaken assertions, skip tests, or hide flakes to obtain a green run.
- When a function's boundary defaults an unspecified clock to `new Date()`,
  always pass an explicit `now` in its tests rather than a hardcoded fixture
  timestamp — the real wall clock keeps moving, and a fixture written against
  a simulated or past date will read as already-expired the moment real time
  catches up to it, failing on a delay rather than a regression.
- When a write or invariant moves behind a new seam, move the test that pinned
  it rather than deleting the assertions that can no longer reach it. A
  caller's test that mocked the old internals will fail on extraction, and
  rewriting it as a delegation test is correct — but the invariant itself
  (the transaction, the ordering, the atomic claim) now needs its own test at
  the new seam. Extraction usually happens because a second caller is
  arriving, which is precisely when quietly losing that guarantee costs the
  most.
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

When behavior depends on more than one policy dimension — such as role,
lifecycle state, nullable/shared ownership, and a selected target scope — build
a small explicit matrix. Include every semantically distinct state plus
unauthorized and mismatched-scope negatives; pairwise samples are sufficient
only when omitted combinations are genuinely equivalent.

A fixture trimmed to what the current assertions can see is only safe while the
inputs stay the same. Mocking the component that *displays* a derived value
does not mock the code that *computes* it — the same field usually also feeds a
filter, sort, or authorization path that still runs for real — and a stub
missing that field passes every existing case simply because no test yet
supplies the input which reaches that path. The first test that does runs real
logic over the stub and fails far from the assertion that provoked it. When a
new case varies a query parameter, filter, role, or scope, ask what unmocked
code that input activates and give the fixture the fields it reads.

When a seam resists testing, treat that as a design signal before reaching for
a heavier mock:

- **The test environment cannot reproduce the real API.** Simulated DOM and
  runtime shims are lossy in ways that silently change behavior — jsdom, for
  one, hands back a zero-byte, nameless placeholder for a file input in
  `new FormData(form)` and reports a `required` file input as invalid even
  once a file is attached. Code that re-derives submitted state from a DOM
  serialization is untestable there; holding the real object in component
  state fixes the test and usually improves the interface. The same gap
  applies to a mocked third-party client: asserting the exact arguments
  passed to a stubbed `create()`/`send()` call proves your code built the
  shape you intended, not that the live service accepts it — a provider
  enforcing mutually-exclusive or required-together parameters rejects that
  shape only at the real endpoint, and an SDK type that leaves every one of
  them optional gives no compile-time warning either. Check the provider's
  documented parameter-combination rules for any newly-added or
  rarely-exercised field rather than trusting the mock alone.
- **A guard sits behind an import-time environment restriction.** Reaching a
  path-shape or authorization check that lives in a module which refuses to
  load under test means mocking that boundary away, which proves nothing.
  Extract the pure guard into its own module and assert it directly, keeping
  the environment-bound I/O on the other side of the split.
- **Text is split across sibling nodes by an inline element.** A query like
  `getByText` matches an element's own text; content broken into separate
  text-node siblings by a `<br/>` (or similar) won't match either side
  individually, and `textContent` concatenates them with no separator, so
  even a full-string match can silently fail or hit the wrong element.
  Assert with `container.textContent` (or `.toContain`) or a structural
  check — counting paragraphs, confirming the `<br/>` exists — instead of
  querying each line with `getByText`. The same trap fires with no inline
  element at all, whenever JSX interleaves an expression with literal text —
  `<Text>{first} {last}</Text>` compiles to three sibling children
  (`{first}`, the literal `" "`, `{last}`), not one string. A non-DOM
  tree-flattening test helper (e.g. a `collectText` walker over a
  `@react-pdf/renderer` element tree, which has no DOM to query) reproduces
  each sibling as its own array entry, so `toContain("First Last")` fails
  even though the rendered output is correct. Join the flattened array
  before asserting a multi-word substring, the same fix as `textContent`.
- **A mocked call's arguments are asserted with a full literal object
  instead of a partial matcher.** `toHaveBeenCalledWith({ where, data })`
  with no `objectContaining` pins the *complete* argument shape, so it
  breaks the moment production code gains one more sibling key on that same
  call — e.g. adding an `include`/`select` to an existing Prisma
  `update`/`create` — even though nothing the test actually cares about
  changed. The break looks like a real regression and is easy to "fix" by
  copying the new field into every assertion without asking whether the
  test meant to pin it. Before widening any existing Prisma (or similar
  builder-call) argument shape, grep the test files that mock it for exact
  literal `toHaveBeenCalledWith` objects on that call and wrap them in
  `expect.objectContaining` unless the test is specifically about the full
  shape.
- **A decoding accessor normalizes away the artifact under test.** Reading a
  response or file through `text()`, `json()`, or `toString()` applies a
  decode step that can silently drop exactly what the assertion exists to
  pin: the Fetch API's `text()` strips a leading UTF-8 BOM, so an export that
  stopped emitting one still satisfies a text-based assertion written to
  require it. Assert byte-level guarantees — BOMs, encodings, line endings,
  trailing newlines — off the raw bytes instead, and treat "the assertion is
  green but I never looked at the bytes" as unverified.

### 4. Add authorized tests

In `strengthen` mode, follow existing patterns and keep each new test
deterministic, isolated, readable, and focused. Avoid unrelated production
refactors. If a genuine defect is revealed, report it; do not silently fix
production code unless the user authorized remediation.

### 5. Validate

- Run the narrowest affected test target first.
- Run the repository's broader test command when practical.
- Run type checking and linting when tests or seams changed.
- If a full-suite timeout is followed by mock-count or shared-state failures,
  rerun the affected files alone or with bounded workers before classifying
  each failure. Timed-out async work can continue into the next case and turn
  one resource-contention failure into a misleading cascade.
- Check for accidental focus markers, skips, leaked timers, shared state, and
  over-broad mocks.
- **Never validate a change to the test suite by running the test suite.** It
  reports on the tests that exist, so coverage that stopped existing passes
  green and the count moves too little to notice inside a large run. Read the
  diff for every touched test file and account for its deletions: adding tests
  should be near-pure insertion, and any deletion must be one you intended and
  can name. This is the failure mode of writing a whole file at a path assumed
  to be new — a test file that already existed is replaced, not extended, and
  every gate stays green.
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
