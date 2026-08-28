---
name: release-notes-on-session-end
description: Draft or record a plain-language summary of work completed on the bsnes web port and update the repository's established README, AGENTS.md, and docs/web-port.md surfaces without changing the version. Use when the user asks for session release notes, a same-version change summary, documentation of what changed, or the release-note portion of an end-session workflow. Do not use to bump a version, invent a changelog, or post the summary externally.
---

# Session Release Notes

Turn verified session outcomes into concise user-facing notes, then place them
only in documentation surfaces the repository already owns.

## Select the mode

- Use **draft** to return a summary without editing.
- Use **record** when the user asks to update release notes or when
  `$end-session` composes this skill.

Default to `draft` for a request that asks only what changed.

## Establish inputs

- Read repository instructions and its release/documentation conventions.
- For a repository with a maintained profile, read
  [references/repository-profiles.md](references/repository-profiles.md).
- Reconstruct the session from the conversation, task artifacts, scoped diff,
  tests, and completed backlog items. Git history alone is insufficient.
- Separate user-visible outcomes, operator-relevant changes, internal
  maintenance, unresolved work, and work that predated the session.
- Determine whether `$version-bump` is also running. That skill owns the new
  version and new-version registry entry; this skill owns the wording.

## Preserve boundaries

- Do not bump a version, roll a release sentinel, commit, tag, push, deploy, or
  post to Zendesk, email, chat, or another external system.
- Do not create filler notes when nothing user-facing or operator-relevant
  changed.
- Do not invent a release registry, About screen, session-summary file, or
  documentation policy in a repository that has none.
- Preserve historical entries, current schema, category vocabulary, ordering,
  tone, and date format.
- Never include secrets, personal data, credentials, internal-only exploit
  detail, or claims that were not verified.
- Do not overwrite another session's work. Append or merge only into the
  repository's current entry as its policy permits.

## Run the workflow

### 1. Build the change ledger

For each candidate note, capture the verified outcome, audience, evidence, and
category. Prefer categories already used by the repository, such as New,
Improved, and Fixed.

Exclude:

- implementation trivia with no operational effect;
- speculative or unfinished work;
- generated-file churn;
- unrelated pre-existing changes; and
- repeated wording already present in the target entry.

### 2. Draft plain-language notes

- Lead with what a user or operator can now do, what behaves better, or what no
  longer fails.
- Keep each item independently understandable and concise.
- State a material limitation only when it changes how the feature should be
  used.
- Use technical names only when they help the intended audience locate the
  feature or understand the impact.

### 3. Record in established surfaces

In `record` mode:

- **Same version:** append or merge items into the current release entry only
  where the repository explicitly supports same-version notes.
- **New version:** let `$version-bump` create the matching entry, then place the
  session wording there without creating a second entry.
- Update a concise About or feature overview only for a genuinely new or
  materially changed capability.
- Update the detailed README or operating documentation only where behavior,
  setup, routes, permissions, or usage changed.
- Update canonical agent guidance only when a convention or current-state
  claim changed, not merely to duplicate the session summary.

Use `$documentation-sync` when the affected documentation extends beyond the
known release surfaces.

### 4. Validate

- Confirm every note traces to session evidence.
- Confirm the newest/current entry parses and retains its established schema.
- Check that About remains concise and detailed docs remain useful.
- Search for duplicate bullets and contradictory current-release claims.
- Run the smallest relevant type, parse, link, or documentation checks.
- Inspect the diff and report intentionally skipped surfaces.

## Deliverable

Return the drafted notes and, in record mode, list each updated surface,
validation result, omitted internal-only change, and any release or external
handoff left to another skill.

## Completion criteria

- Notes describe verified outcomes in audience-appropriate language.
- Nothing was written when no meaningful note existed.
- Established release and documentation schemas remain intact.
- The version did not change.
- No external message was posted.
- Validation passed or exact limitations are reported.

## Resources

- [references/repository-profiles.md](references/repository-profiles.md) —
  release-note and documentation destinations for reviewed projects.
