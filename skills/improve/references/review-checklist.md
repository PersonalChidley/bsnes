# Repository review checklist

Use relevant sections at triage depth. Record exclusions and explain why a
section does not apply rather than forcing findings into every category.

## Repository and governance

- Identify repository purpose, supported status, primary languages, entry
  points, and validation commands from current evidence.
- Read root and applicable nested agent instructions.
- Locate architecture decisions, public contracts, policies, roadmaps, release
  guidance, ownership rules, and existing backlogs.
- Compare the working tree with tracked files; preserve unrelated work.
- Exclude caches, build output, vendored artifacts, and sensitive stores unless
  the repository explicitly places them in review scope.

## Documentation

- Verify README status, setup, commands, paths, examples, and roadmap claims.
- Separate implemented behavior, accepted direction, proposals, and future
  ideas.
- Find conflicting definitions, duplicated normative text, inconsistent terms,
  broken links, orphaned documents, and missing navigation.
- Check that comments and docstrings still describe their code.
- Trace TODO, FIXME, HACK, XXX, deprecation, and placeholder markers to context.
  Do not assume every marker is stale.
- Prefer a single authoritative description with links from summaries.

## Architecture and contracts

- Compare implementation boundaries with accepted architecture and decisions.
- Check dependency direction, component ownership, data flow, public schemas,
  compatibility commitments, and migration status.
- Identify decisions implied by code but absent from an accepted record.
- When a new feature needs an identity, link, or slot an existing feature
  already owns through a unique column or single-valued field, check whether it
  can widen that mechanism instead of adding a parallel one. Two mechanisms
  writing the same single-valued field race each other, and neither can be made
  correct on its own.
- When an action cancels, closes, or replaces state the same view can create,
  check which id it is keyed by. Keying it to the created row's own id leaves
  that row uncontrollable between creation and the next fetch, and forces the
  call site to invent a placeholder for the "nothing exists yet" branch — that
  placeholder is the signal, not an inconvenience. Key such actions by the
  stable parent the person is acting on, and let a value the action returns win
  over the one rendered with the page.
- When one view's displayed toggle (open/closed, enabled/disabled) can be set
  by more than one action, check that it is derived from a value every
  contributing action writes. A flag read from only the opening action's own
  result — ignoring whether the closing action succeeded — latches on
  permanently once the opener has ever succeeded, so "close" renders as if it
  never happened even though the underlying state changed correctly.
- When a shared derivation has audience-specific variants, check which layer
  picks the variant. Centralizing the rules into one calculator does not
  prevent divergence if a leaf component then chooses which version of them to
  run: two components on one screen each call "the" shared function, get
  different answers, and both look correct in isolation. The symptom is a
  page contradicting itself — one panel saying a section is finished while the
  navigation beside it says it is not, and two counters disagreeing. Push the
  choice up to the caller that knows the audience and pass the computed result
  down, so a component cannot hold a rule at all. Then pin it with a parity
  assertion that walks every case in both shapes, rather than a test per
  surface, which is what let them drift apart in the first place.
- When an action authorizes on a union of conditions, check that the list of
  things the UI offers it for is derived from that same union. A control fed
  by one narrower slice while the action accepts a wider one strands the
  people in the difference: they can perform the act from a surface that does
  list the item, then find no way to undo it from the surface they actually
  land on. Derive the affordance from the authorization predicate rather than
  restating it, and be suspicious whenever the two are separate queries.
- Distinguish a stale document from a genuine unresolved decision.
- Propose clarification for inconsistencies; do not redesign the system during
  a repository-health review.

## Source and maintainability

- Inspect callers and tests before classifying code as dead, duplicated, or
  unnecessary.
- Look for oversized responsibilities, hidden state, unclear interfaces,
  inconsistent error handling, unsafe mutable defaults, and needless
  abstraction.
- Note repeated logic that can drift, but do not recommend consolidation when
  similarity is accidental or responsibilities differ.
- Find the places where two modules must agree — a derived key, a serialized
  format, a message, a sort order — and check that one of them owns it. A
  convention kept only by discipline drifts, and the drift is usually silent.
- Treat failures that return empty as more dangerous than failures that throw. A
  missed lookup, a swallowed exception, or a default that stands in for absent
  data can leave every value plausibly wrong while every check stays green.
  Confirm a zero, an empty list, or a uniform result is real before accepting it.
- When a new form, print, or export surface offers the same choice set as an
  existing labeled enum, check whether it imports and maps over that enum's
  canonical `*Values`/`*Order` and `*Labels` pair rather than retyping the
  English text by hand. A hand-typed copy passes review and typecheck while
  silently drifting from the source of truth — only a test asserting the real
  label catches it.
- When two sequences must line up by position rather than by name — a table's
  header cells and its body cells, a CSV header array and the row builder that
  fills it, column definitions and the code that writes each cell — review the
  pairing, not each list on its own. Transposing two entries breaks nothing a
  gate can see: the arity still matches, the types still check, the output
  still looks like a table, and the only symptom is data sitting under someone
  else's heading. Derive both sides from one ordered source where the surface
  allows it, and pin the correspondence with an assertion that walks heading
  and cell together — reading each list separately is what let them disagree.
- Check typing, naming, module ownership, boundary validation, and comments for
  maintainability impact.
- For spreadsheet imports, inspect structured and merged-cell value shapes as
  well as displayed text. A non-master alias can stringify rich text as an
  object marker even though the sheet looks ordinary; normalize values at the
  ingestion boundary and pin representative real-format cells before
  persistence.
- Check design-token pairings against the palette definition, not token names:
  an on-color foreground token (`*-foreground`, `*-ink`, on-X) contrasts only
  with its own paired background, so a copied state style that puts one on a
  different surface ships unreadable UI that no build step or type check
  catches.
- When a hand-rolled classifier turns semi-structured text into typed blocks
  (markdown-lite, log lines, config sections) by first splitting on a blank-line
  separator and only inspecting each chunk's first line to decide its type,
  check what happens when two structural markers land in the same chunk with no
  blank line between them — a sub-heading directly under a heading, a second
  directive right after the first. The second marker's own line gets read as
  body text and silently folded into the first marker's content: no error, no
  empty result, just that marker's text missing from the output and stray
  syntax leaking into a paragraph. Classify per line in a single pass instead —
  flush whatever accumulator (paragraph, list) is open the moment a new
  structural marker or a blank line appears — rather than pre-chunking and
  trusting only the first line of each piece.
- Prefer deletion and simplification only when behavior and ownership remain
  clear.

## Tests and reproducibility

- Map critical behaviors and failure paths to tests.
- Check ordinary, negative, boundary, adversarial, and regression cases where
  relevant.
- Identify tests that assert implementation details rather than contracts.
- Look for nondeterminism, shared mutable state, external-service coupling,
  missing fixtures, and unrecorded configuration.
- Ask which behavior differs between development, CI, and production, and
  whether anything tests the production path. Error surfacing, redaction,
  minification, caching, and environment-gated branches are correct in one and
  wrong in another, and a suite that only exercises the friendly environment
  will not notice.
- Do not state numeric coverage without a coverage measurement.
- Distinguish missing tests from tests that are present but weak.

## Security, privacy, and supply chain

- Look for committed secrets, unsafe defaults, untrusted input crossing trust
  boundaries, command or query injection, insecure deserialization, weak
  authorization, path traversal, and sensitive logging.
- Check size, time, recursion, and resource bounds on hostile input.
- Review data egress, telemetry, retention, redaction, and external-service
  flows against repository policy.
- Inspect dependency manifests, pinning, integrity controls, licenses, and
  update practices when dependencies are in scope.
- Do not open credential stores or print secrets. Escalate a credible exposure
  without reproducing sensitive material.

## Performance and operability

- Identify unbounded work, repeated I/O, unnecessary serialization, avoidable
  network round trips, algorithmic hotspots, payload growth, and missing
  backpressure.
- Prefer measurements, profiles, or clear complexity evidence over intuition.
  For pattern-matching, parsing, or loop-heavy code that runs on untrusted or
  user-composed input, script a timing comparison across doubling input sizes
  rather than reading the pattern for correctness alone — superlinear growth
  (e.g. regex backtracking) is often invisible on typical inputs and cheap to
  catch this way. Before trusting a new regression test to protect a fix,
  confirm it actually fails against the pre-fix code.
- Check timeouts, retries, idempotency, failure isolation, observability, and
  recovery paths where the repository supports operations.
- Separate present bottlenecks from scale risks and speculative optimizations.

## Agent instructions

- Keep one canonical repository contract.
- Limit tool-specific files to actual tool behavior and concise references.
- Remove copied rules that can drift, without weakening safety or domain
  invariants.
- Verify instruction paths, commands, supported architecture, and terminology.
- Ensure workflows do not silently broaden authorization for edits, external
  actions, publication, credentials, or live operations.

## Evidence quality

- Cite repository-relative paths and line numbers for material findings when
  practical.
- Name the command, test, or comparison that verifies a behavioral finding.
- Mark inferences and state what would verify them.
- Avoid unsupported severity, effort, or performance claims.
- Preserve counterevidence and strengths; a health review is not a defect hunt.
