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
- Check typing, naming, module ownership, boundary validation, and comments for
  maintainability impact.
- Prefer deletion and simplification only when behavior and ownership remain
  clear.

## Tests and reproducibility

- Map critical behaviors and failure paths to tests.
- Check ordinary, negative, boundary, adversarial, and regression cases where
  relevant.
- Identify tests that assert implementation details rather than contracts.
- Look for nondeterminism, shared mutable state, external-service coupling,
  missing fixtures, and unrecorded configuration.
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
