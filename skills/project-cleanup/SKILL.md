---
name: project-cleanup
description: Find stale, orphaned, duplicated, generated, or unused repository files by tracing imports, runtime discovery, configuration, documentation, build inputs, and deployment references, then propose or perform a recoverable cleanup. Use for workspace cleanup, dead-file review, old configuration or script retirement, stale-document archiving, or evidence-backed file removal planning. Default to read-only assessment and do not move or delete files without explicit approval of exact targets.
---

# Project Cleanup

Identify file-lifecycle debt with evidence, then retire only confirmed targets
through the repository's safest supported recovery path.

## Select the mode

- Use **assess** to inventory and report candidates without changing files.
- Use **archive** only after the user approves exact targets and the repository
  has an established archive, trash, or recoverable move convention.

Default to `assess`. A request to "review" or "find unused files" is not
authorization to move or delete anything.

## Establish context

- Read repository instructions, architecture, README, project summary,
  deployment configuration, build manifests, and cleanup/archive policy.
- Inspect version-control status and preserve unrelated work.
- Exclude dependencies, virtual environments, caches, build output, logs,
  reports, exports, backups, credential stores, and generated clients from
  source-cleanup analysis unless specifically requested.
- Identify dynamic loading, route discovery, reflection, plugin registration,
  file globs, framework conventions, packaging rules, and external automation
  that may not appear as ordinary imports.

## Preserve boundaries

- Never classify a file as unused from import search alone.
- Do not retire core manifests, repository governance, CI, migrations,
  deployment configuration, auth entry points, generated-source inputs, or
  disaster-recovery material without a specific evidence trail and approval.
- Do not open, copy, or archive secret-bearing local files merely to tidy the
  tree.
- Preserve file content and relative history when archiving.
- Do not overwrite an existing archive target.
- Prefer a reversible move over deletion. If the user explicitly requires
  irreversible deletion, stop and handle it under the environment's
  destructive-action rules rather than treating it as ordinary archive mode.
- Do not update unrelated code or documentation opportunistically.

## Run the workflow

### 1. Build the active-file model

Inventory source, tests, docs, configuration, automation, schemas, migrations,
scripts, assets, generated inputs, and known reference-only trees. Determine
which roots and entry points the build, runtime, package, deploy, and test
systems actually consume.

### 2. Trace every candidate

For each candidate, check:

- static and dynamic imports;
- route, command, plugin, or framework naming conventions;
- manifests, configuration, file globs, packaging, and deployment rules;
- tests, fixtures, migrations, seeds, templates, and code generation;
- documentation, runbooks, support procedures, and external invocation;
- Git history when it clarifies replacement or deprecation; and
- a verified successor, duplicate, or retirement decision.

Record counterevidence. "No inbound text match" is a lead, not proof.

### 3. Classify confidence

- **confirmed unused** — no active consumer and direct replacement or
  retirement evidence exists;
- **likely stale** — evidence is strong but a dynamic or operational consumer
  remains unverified;
- **reference-only** — intentionally retained historical or migration context;
- **generated/ephemeral** — should be ignored or reproducibly regenerated, not
  archived as source; or
- **active** — at least one current consumer exists.

Group confirmed candidates by responsibility, not merely file extension.

### 4. Present the cleanup proposal

For each proposed target, report:

- repository-relative path;
- category and confidence;
- evidence of non-use and any successor;
- recovery destination;
- references or docs that need follow-up; and
- validation required after the move.

Ask the user to approve all, some, or none of the exact targets. Do not bundle
uncertain candidates into the approval set.

### 5. Archive approved targets

In archive mode:

- resolve and verify every absolute source and destination stays within the
  intended repository and archive root;
- use the repository's established date/category structure, or propose one
  before moving when none exists;
- preserve relative subpaths when names could collide or context matters;
- use one operating-system-native move mechanism end to end; and
- stop on collisions or an unexpected source state.

### 6. Reconcile and validate

- Re-run reference searches after the move.
- Update active documentation or configuration that intentionally pointed at
  the retired file, but only within the approved cleanup scope.
- Run the smallest relevant build, type, lint, and test checks.
- Inspect status/diff and confirm archived content is recoverable.
- Report every uncertain or deferred candidate separately.

## Deliverable

In assess mode, provide the evidence-ranked candidate list and exact proposed
archive plan. In archive mode, also list moved files, destinations, follow-up
edits, validation, and recovery instructions.

## Completion criteria

- Every proposed file has direct reference evidence and counterevidence review.
- Exact targets were approved before any move.
- Moves stayed inside verified repository and recovery roots without overwrite.
- Active references and required documentation were reconciled.
- Validation passed or exact limitations are reported.
- No irreversible deletion occurred under this workflow.
