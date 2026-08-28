---
name: documentation-sync
description: Reconcile repository documentation, examples, runbooks, and agent guidance with current implementation and accepted source-of-truth decisions. Use when documentation may be stale or contradictory, after behavior or conventions change, when synchronizing duplicated guidance, or when auditing docs against code. Do not use to invent product policy, make unresolved architecture decisions, or perform a broad repository health review.
---

# Documentation Sync

Make documentation describe the repository's verified current state while
preserving intentional history and ownership. Treat synchronization as an
evidence task, not a prose rewrite.

## Select the mode

- Use **assess** to report drift without editing.
- Use **sync** when the user authorizes documentation changes.
- Use **post-change** after an implementation change to update only affected
  documentation and guidance.

Default to `assess` when edit authorization is unclear.

## Establish inputs

- Read applicable repository instructions and nested guidance first.
- Identify the implementation, decision record, schema, configuration, or
  other artifact that is authoritative for each claim.
- Discover relevant READMEs, runbooks, examples, API docs, environment
  templates, release notes, and assistant-specific instruction files.
- Inspect version-control status and preserve unrelated work.
- Determine whether generated documentation has a supported generator; never
  hand-edit generated output when regeneration is required.

## Preserve boundaries

Follow the [shared review conventions](../improve/references/review-conventions.md)
for mode selection, evidence and honest reporting, and preservation of unrelated
work. The boundaries below are specific to documentation sync.

- Do not change product behavior, configuration, dependencies, schemas, or
  architecture to make documentation true.
- Do not resolve product, security, or architecture ambiguity by choosing a
  policy. Record the conflict and its required owner.
- Do not erase historical rationale from decision records or release notes.
- Keep one canonical statement for shared rules. Replace avoidable duplicates
  with short references, while retaining tool-specific differences.
- Never copy secrets or private data into documentation or examples.
- Follow repository rules for paired instruction files and required release
  notes.

## Run the workflow

### 1. Build a documentation map

Map each relevant document to its audience, purpose, authority, and claims.
Locate duplicated terminology, commands, paths, configuration names, examples,
and statements about current behavior.

### 2. Verify claims

Trace material claims to direct evidence such as implementation, tests,
manifests, schemas, generated help, or accepted decisions. Distinguish:

- **stale** — evidence conclusively contradicts the document;
- **incomplete** — required current behavior is omitted;
- **duplicate** — the same rule has multiple maintainers;
- **ambiguous** — authority or intended behavior is unresolved; and
- **accurate** — checked and supported.

Do not treat search results alone as proof. Inspect definitions and callers,
and run narrow commands when documentation describes executable behavior.

### 3. Plan the reconciliation

Choose the smallest authoritative edit set. For every proposed change, record
the document, claim, evidence, intended correction, and any downstream copies
or links that must remain aligned.

### 4. Apply authorized edits

In `sync` or `post-change` mode:

- correct stale current-state claims;
- add missing operational prerequisites and validation steps;
- update examples and environment-variable documentation;
- synchronize paired instruction files required by repository policy;
- replace duplicated shared policy with links to its canonical owner; and
- preserve the voice and information architecture of sound documents.

Do not rewrite unrelated sections for style.

### 5. Validate

- Re-run the searches that found drift.
- Check changed links, headings, paths, commands, and code examples.
- Run the smallest relevant executable checks for behavioral claims.
- Inspect the final diff for accidental policy changes or unrelated edits.
- Report unavailable, skipped, and failed checks honestly.

## Deliverable

Report:

1. scope, mode, and authoritative sources used;
2. synchronized files and the claims corrected;
3. unresolved conflicts with the decision owner needed;
4. validation performed and limitations; and
5. remaining documentation debt, ordered by operational impact.

## Completion criteria

- Every changed claim is supported by evidence.
- All affected canonical and required paired documents are aligned.
- Generated and historical documents retain their intended handling.
- Unresolved decisions remain explicit rather than silently normalized.
- The final diff contains only authorized documentation changes.
