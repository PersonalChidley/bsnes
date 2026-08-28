---
name: version-bump
description: Cut a repository release by validating a strictly newer semantic version, updating the verified version source of truth and any lockfile metadata, adding the repository's established structured release notes, synchronizing required documentation, and running release checks. Use when the user asks to bump a version, cut or prepare a release, publish a new build version, or create release notes tied to a new version. Do not use for a same-version session summary, deployment, tagging, or publication.
---

# Version Bump

Prepare a coherent local release change without conflating it with commit,
tag, deployment, distribution, or external publication.

## Establish inputs

- Read repository instructions, release guidance, version sources, release-note
  consumers, manifests, and validation commands.
- For a repository with a maintained profile, read
  [references/repository-profiles.md](references/repository-profiles.md).
  Current repository evidence overrides the profile.
- Obtain an exact target version. When only a bump level is given, compute the
  exact version and confirm it before editing.
- Derive release highlights from the actual session, scoped diff, completed
  backlog items, and verified behavior. Do not manufacture highlights from a
  version number or copy stale roadmap text.
- Establish an explicit unreleased change set. If the working tree is clean,
  use only a user-approved commit/range or other verified release scope. If no
  unreleased work can be identified, stop after reporting the release
  mechanics and ask for the intended contents; do not republish old backlog or
  historical release items under a new version.

## Preserve boundaries

- Do not commit, tag, push, deploy, build a distribution, publish a package,
  update a live version table, or post release messages unless separately
  authorized.
- Treat the repository's runtime-consumed version location as authoritative.
  Do not make a README badge or copied document the source of truth.
- Do not invent a release registry or policy for a repository that lacks one.
- Keep secrets, credentials, private data, and internal exploit details out of
  release notes.
- Preserve unrelated working-tree changes and established note ordering,
  schema, tone, and date format.
- Never downgrade, reuse the current version, or silently replace a prior
  release entry.

## Run the workflow

### 1. Resolve release mechanics

Trace how the running application obtains its version and how users see release
notes. Inspect importers and tests, not only agent instructions. Identify:

- authoritative current-version field;
- lockfile or generated metadata that must match;
- structured release-note registry and its ordering;
- documentation mirrors;
- validation commands; and
- any release automation that must not be triggered.

If these are ambiguous, stop and request the missing release-policy decision.

### 2. Validate the target

Run:

```text
python scripts/check_semver.py <current> <target>
```

from this skill directory, or apply the same strict comparison when the script
is unavailable. The target must be a plain `MAJOR.MINOR.PATCH` value and
strictly newer. Follow explicit repository policy instead for prerelease
versions.

### 3. Prepare release content

- Confirm every candidate item belongs to the explicit unreleased change set.
  Treat a clean tree, an already-versioned commit, or a historical backlog note
  as insufficient on its own.
- Write a short title only when the registry schema requires it.
- Group plain-language outcomes using the repository's established categories.
- Describe what changed for users and operators, not implementation trivia.
- Include material limitations only when users need them to operate the
  release safely.
- Avoid duplicate bullets across the structured registry and documentation.
- Stop rather than create an empty release or move previously published notes
  between historical versions.

### 4. Apply the release edit

- Update the authoritative version source exactly once.
- Align package-lock or equivalent root metadata when it stores the project
  version.
- Prepend or roll the structured release entry exactly as the repository's
  current implementation requires.
- Preserve all historical entries.
- Update current-release documentation and close only backlog items actually
  delivered.

Use `$documentation-sync` when multiple guidance surfaces need claim-by-claim
reconciliation.

### 5. Validate

- Re-read the authoritative version through the same runtime path used by the
  application where practical.
- Confirm the newest structured release entry matches the target and parses.
- Confirm lockfile metadata, docs, and tests agree with the source of truth.
- Run the repository's release checks from its current instructions.
- Search for stale copies of the previous current version, distinguishing
  intentional historical notes from drift.
- Inspect the diff for unrelated edits, duplicated entries, date mistakes, and
  accidental publication artifacts.

## Deliverable

Report the old and new versions, release highlights, files changed, checks run,
failures or limitations, and every publication step deliberately not taken.

## Completion criteria

- The target was exact, valid, and strictly newer.
- Every release item belongs to a verified, explicit unreleased change set.
- The runtime version source, lock metadata, and top release entry agree.
- Historical releases remain intact and newest-first.
- Required current-release documentation is synchronized.
- Repository release checks pass or exact failures are reported.
- No commit, tag, deployment, distribution, or external publication occurred
  without separate authorization.

## Resources

- [references/repository-profiles.md](references/repository-profiles.md) —
  verified release mechanics for reviewed repositories.
- [scripts/check_semver.py](scripts/check_semver.py) — strict
  `MAJOR.MINOR.PATCH` comparison used before editing.
