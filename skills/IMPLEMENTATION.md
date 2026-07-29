# Skills Framework Implementation Guide

Use this guide to transplant the `skills/` directory into another repository
without turning portable workflows into a second source of project policy.

## Choose an adoption level

### Minimal adoption

Copy only the generic packages you need:

```text
skills/
|-- README.md
|-- TEMPLATE.md
|-- IMPLEMENTATION.md
|-- documentation-sync/
|-- performance-review/
|-- security-review/
`-- test-coverage-review/
```

Invoke a skill by its file path if the assistant does not automatically
discover repository-owned skills:

```text
Use the skill at skills/security-review/SKILL.md to review this repository.
```

This option requires no assistant-specific adapter.

### Full framework adoption

Copy the complete `skills/` directory, adapt project-specific packages, add
discovery adapters for each assistant, and connect the workflows to the new
repository's instruction and maintenance files.

## 1. Copy the framework

Place the directory at the new repository root:

```text
new-project/
|-- skills/
|   |-- IMPLEMENTATION.md
|   |-- README.md
|   |-- TEMPLATE.md
|   `-- <skill-name>/
`-- <project files>
```

Preserve every package's internal structure. `SKILL.md` is canonical;
`agents/`, `references/`, `scripts/`, and `assets/` are supporting resources
and should remain relative to it.

Do not copy cache directories, generated files, or assistant discovery
adapters from outside `skills/` unless the target project uses that assistant.

## 2. Classify the copied packages

Review each package before enabling it:

- `documentation-sync`, `performance-review`, `security-review`, and
  `test-coverage-review` are designed to be repository-portable.
- `improve` is specific to the current host repository. Adapt its project name,
  commands, backlog paths, focus areas, architecture rules, and recording
  requirements before using it elsewhere.
- `release-notes-on-session-end` targets the current project's release
  notes. Adapt its audience, destination, tone, and trigger language.
- `TEMPLATE.md`, `README.md`, and this guide are framework documents, not
  invocable skills.

Search for source-project assumptions:

```powershell
rg -n "bsnes|docs/improvement-backlog|npm run|core:build" skills
```

Classify every match as portable terminology, a target-project replacement, or
a reason not to install that package.

## 3. Establish the target repository contract

Create or update the target repository's canonical instruction file before
running edit-capable skills. `AGENTS.md` is the usual cross-agent location;
retain an existing project convention when one already exists.

At minimum, define:

- the product and repository purpose;
- architecture and source-of-truth boundaries;
- authorization and destructive-operation rules;
- supported lint, type-check, test, build, and migration commands;
- documentation, backlog, and release-note locations;
- generated or vendored paths that must not be edited; and
- required handling for secrets, production data, and external services.

Skills must defer to this repository contract. Keep project policy in the
contract and reusable procedure in `skills/<skill-name>/SKILL.md`.

## 4. Configure assistant discovery

Discovery is assistant-specific. Keep the repository-owned package canonical
and use a thin pointer wherever possible.

### Path-based invocation

This is the portable fallback and works without an adapter:

```text
Read and follow skills/test-coverage-review/SKILL.md, then review the checkout
in assess mode.
```

### Claude Code

Create `.claude/skills/<skill-name>/SKILL.md`. Copy the canonical skill's
`name` and `description` frontmatter so discovery triggers remain aligned, then
point to the canonical body:

```markdown
---
name: skill-name
description: Copy the exact description from skills/skill-name/SKILL.md.
---

Follow the canonical workflow at `../../../skills/skill-name/SKILL.md`.
This file is only a Claude Code discovery pointer; the canonical workflow
lives in the repository-owned skill package.
```

Do not copy the full workflow into `.claude/skills/`; duplicated bodies drift.

### Codex

Each package's `agents/openai.yaml` supplies Codex-facing display metadata.
For automatic personal discovery, install or link the package under
`$CODEX_HOME/skills`; when `CODEX_HOME` is unset, use `~/.codex/skills`.
For a repository-only setup, invoke the canonical `SKILL.md` by path unless
the current Codex host provides a project skill-discovery directory.

If you copy rather than link a package into a personal skills directory, treat
the repository copy as canonical and repeat the copy after updates.

### Other assistants

Use the assistant's supported project discovery directory. Its adapter should
contain only the trigger metadata and a pointer to
`skills/<skill-name>/SKILL.md`. If pointers are unsupported, document which
copy is authoritative and add synchronization to the maintenance checklist.

## 5. Adapt project-specific workflows

For every retained project-specific package:

1. Replace the source project name and domain language.
2. Replace hard-coded paths with the target repository's real paths.
3. Replace validation commands with commands verified in the target manifest.
4. Remove architecture rules already owned by the repository contract and
   link to that contract instead.
5. Update output destinations and completion criteria.
6. Update `agents/openai.yaml` and every discovery adapter if the name,
   description, or default prompt changes.
7. Delete a package when its primary responsibility does not apply.

Do not perform blind search-and-replace on domain terms. Read each occurrence
in context so safety boundaries and workflow meaning remain intact.

## 6. Connect skill composition

Nominate one coordinator when several skills contribute to the same review:

```text
security-review --------\
performance-review ------> coordinator/backlog owner
test-coverage-review ----/
documentation-sync -----> final documentation reconciliation
```

Pass findings as explicit artifacts. Preserve each specialist's evidence,
confidence, and severity. Do not run two edit-capable skills against the same
file concurrently.

For a small project, the coordinator can be a human-maintained backlog. For a
recurring improvement loop, adapt `improve` only after the target backlog,
validation commands, and recording conventions exist.

## 7. Validate the installation

Check every installed package:

- the folder name equals the frontmatter `name`;
- frontmatter contains `name` and `description`;
- the description states triggers and important non-triggers;
- every relative resource link resolves;
- every `agents/openai.yaml` default prompt names `$<skill-name>`;
- assistant adapter descriptions match the canonical description;
- no template placeholders or source-project assumptions remain; and
- project commands and output paths exist.

Useful checks:

```powershell
rg -n "TODO|replace-with|\\[TODO" skills
rg -n "replace-with|source-project-name" skills
rg --files skills
```

If the Codex skill-creator utilities are installed, run their validator for
each package:

```text
python <skill-creator>/scripts/quick_validate.py skills/<skill-name>
```

Run every bundled script with a safe representative input. Then smoke-test
each skill with one read-only prompt:

```text
Use $documentation-sync in assess mode. Report drift without editing.

Use $test-coverage-review in assess mode on the authentication boundary.

Use $security-review in change-focused mode on the current diff.

Use $performance-review in diagnose mode on the named slow route.
```

Confirm that each result respects repository policy, cites evidence, follows
its output contract, and does not edit in a read-only mode.

## 8. Finish the integration

Update `skills/README.md` so its catalog reflects only packages actually
available in the target repository. Add a short section to the repository's
contributor or agent guidance that identifies `skills/` as the canonical
workflow source and explains how to invoke it.

The framework is bolted in when:

- selected packages are adapted and discoverable;
- repository policy has one authoritative home outside the skills;
- paths, commands, and output destinations match the target project;
- adapters point to canonical skill bodies;
- structural and smoke validation pass; and
- maintainers know how copied or globally installed packages receive updates.
