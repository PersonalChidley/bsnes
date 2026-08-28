---
name: end-session
description: Coordinate a repository's full end-of-session closeout by reconstructing completed work, resolving whether a release is being cut, recording plain-language release notes and affected documentation, running required checks, and preparing or sending an explicitly authorized handoff through an established integration. Use when the user says end session, wrap up, close out the work, finish the release, or asks for the complete session handoff. Do not use for a release-only version change, a summary-only response, or an unrequested external post.
---

# End Session

Close the session coherently without treating every session as a release or
every ticket number as permission for an external write.

## Establish context

- Read repository instructions, current version/release mechanics, backlog,
  validation commands, and working-tree status.
- For a repository with a maintained profile, read
  [references/repository-profiles.md](references/repository-profiles.md).
- Reconstruct only this session's work from the conversation, artifacts,
  scoped diff, tests, and backlog. Separate pre-existing changes and unfinished
  work.
- Identify which closeout capabilities the repository actually supports:
  versioned release, same-version notes, documentation sync, and external
  handoff.

## Resolve consequential decisions

Ask only for decisions not already explicit:

1. **Release decision:** for a repository with formal release mechanics, confirm
   whether to keep the current version or bump it. If bumping, confirm the exact
   `MAJOR.MINOR.PATCH` target before editing.
2. **Handoff target:** ask for a ticket or destination only when repository
   policy requires or the user requested an external handoff.
3. **Post authorization:** prepare and preview the final message. Post only
   when the user explicitly asked for the post or confirms it after preview.

For repositories without a formal release policy, keep the current package
metadata unless the user separately requests and defines a release.

## Preserve boundaries

- Do not commit, tag, push, deploy, publish a package, build a distribution, or
  migrate data unless separately authorized.
- Do not read, print, echo, or embed secret values. Use an established
  repository helper, connector, or CLI that handles credentials internally.
- Do not improvise a raw REST call when no supported handoff path exists.
  Produce a ready-to-send message and report the missing integration instead.
- Keep external notes private/internal when that is the repository contract,
  and verify the actual target before sending.
- Do not claim work shipped merely because it exists in an uncommitted diff.
- Preserve unrelated changes and historical release records.

## Run the workflow

### 1. Harvest engineering lessons

Invoke `$coding-ninja` in harvest mode before building the session ledger.
Persist only evidence-backed, generalizable lessons; let that skill update the
canonical skill bodies, adapters when needed, and the repository backlog. Do
not turn release-note wording into a lesson.

### 2. Build the session ledger

Classify verified outcomes as New, Improved, Fixed, internal maintenance,
unresolved, or pre-existing. Capture validation evidence and affected user or
operator surfaces. Use this one ledger for release notes, documentation, and
handoff wording so they do not contradict each other.

### 3. Apply the release decision

- **Keep version:** do not edit any version source or lock metadata.
- **Bump version:** invoke `$version-bump` with the confirmed target. Let that
  skill own version sources, lock metadata, the new-version registry entry, and
  release validation.

Do not run `$version-bump` merely because the session is ending.

### 4. Record the session

Invoke `$release-notes-on-session-end` in record mode:

- add verified user-facing wording to the correct current or new entry;
- update concise and detailed documentation surfaces that actually changed;
- skip empty/filler notes and internal-only trivia; and
- avoid duplicating release content across mirrors.

Use `$documentation-sync` for broader claim reconciliation, with one nominated
owner for every shared document.

### 5. Validate the workspace

- Run the repository's required lint, type, test, and build gates for the
  session's scope.
- Run focused checks before broad checks when that improves diagnosis.
- Never use production data or live providers as ordinary validation.
- Confirm version, release note, documentation, and backlog claims agree.
- Inspect the final diff and report pre-existing or uncommitted work.

### 6. Prepare the handoff

Draft a concise private note from the session ledger:

- identify a release version only when one was actually created;
- group user-facing New, Improved, and Fixed outcomes;
- mention validation and any operational limitation that the recipient needs;
  and
- avoid secrets, personal data, raw internal logs, and speculative claims.

Show the target and message before posting unless the user's current request
already supplies both and explicitly authorizes sending.

### 7. Send only through a supported path

If authorized, use the repository profile's established helper, CLI, or
connector. Confirm success using a response identifier, status, or fetched
subject that does not expose secrets. If sending fails, do not retry
indefinitely or claim success; retain the prepared body and report the error.

## Deliverable

Report:

- release decision and resulting version;
- recorded New, Improved, and Fixed notes;
- documentation and backlog files updated;
- checks run and exact failures or limitations;
- handoff target, whether it was prepared or sent, and safe confirmation; and
- uncommitted status plus every publication step not taken.

## Completion criteria

- Consequential release and handoff decisions were explicit.
- Version metadata changed only when requested.
- Notes and documentation reflect verified session work.
- Required checks passed or exact limitations are reported.
- Any external post used an established path and explicit authorization.
- No commit, tag, push, deployment, or publication was inferred.

## Resources

- [references/repository-profiles.md](references/repository-profiles.md) —
  session-closeout capabilities and safe handoff paths for reviewed projects.
