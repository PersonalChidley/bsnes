---
name: workspace-sync
description: Compare this repository's skill library against the sibling repositories in the same workspace, report which repository holds the strongest version of each skill, and port a named improvement into this repository with its paths, commands, and domain vocabulary adapted. Use when asked to sync skills across repos, check whether a sibling repo has a better version of a skill, pull an improvement from another repository, audit skill drift across the workspace, or answer "which repo has the best version of X". Do not use to edit a sibling repository, to make every repository's skills identical, or to run a single-repository improvement loop when `$improve` is the better fit.
---

# Workspace Sync

Skills in a multi-repository workspace drift. One repository learns a lesson
and encodes it; its siblings never hear about it. This skill makes the
cross-repository comparison repeatable and lets a proven technique move into
this repository without turning every repository's skills into copies of each
other.

**This skill only ever writes to the repository it is running in.** A sibling
is a read source. Improving a sibling is that repository's own session.

## Select the mode

- Use **survey** to inventory skills across the workspace and report where each
  one is strongest. Read-only. This is the default.
- Use **compare** for one named skill: a close read of every version, and a
  ledger of individually-adoptable features with the repository that has each.
- Use **port** to bring a named improvement into this repository. Requires the
  user to have named what is being ported, or to approve a specific item from a
  survey or compare run.

Default to `survey` when the request is ambiguous. Reading a sibling repository
never implies authorization to write to it.

## Establish inputs

- Read this repository's own governance first: `AGENTS.md`, its agent-guidance
  mirrors, and its skills contract. They constrain what may be adopted.
- Discover siblings with [scripts/workspace_scan.py](scripts/workspace_scan.py).
  It walks up from this repository's root to the common parent, then reports
  every sibling Git repository that has canonical skills, with each skill's
  line counts, bundled resources, adapter coverage, and last commit date.
- Never hardcode an absolute workspace path. The scan derives everything from
  this file's own location, so it keeps working when the workspace moves.
- Read [../improve/references/repository-profiles.md](../improve/references/repository-profiles.md)
  for the stack, package manager, and validation commands of any repository
  named in the run. A profile that disagrees with the repository's current
  manifests is stale; the manifests win.

## Preserve boundaries

Follow the [shared review conventions](../improve/references/review-conventions.md)
for mode selection, evidence, and honest reporting. The boundaries below are
specific to cross-repository work.

- **Write only to this repository.** Never edit, stage, commit, or branch a
  sibling. If a sibling has the defect, report it and stop.
- **Customize, never clone.** A ported feature is rewritten in this
  repository's paths, commands, domain vocabulary, and tone. A pasted script
  with another repository's package manager or directory layout in it is a
  regression, not an upgrade.
- **Preserve identity.** Keep this repository's skill names, directory
  conventions, and voice. Renaming a skill to match a sibling requires explicit
  approval; raise it, do not do it silently.
- **Do not adopt a feature this repository cannot honor.** A step that depends
  on a script, gate, or service this repository does not have is either ported
  with its dependency or not ported at all. Never leave an instruction that
  references something absent.
- **Never transfer a repository profile wholesale.** Sibling profiles go stale
  in ways that read as authoritative — a wrong framework version or a wrong
  package manager in a profile causes real damage.
- **Do not treat similarity as a goal.** Two repositories legitimately differ.
  Only `workspace-sync` itself is expected to stay near-identical across the
  workspace, because its job is explicitly cross-repository.

## Run the workflow

### 1. Survey

Run the scan and read what it returns, then group skills that do the same job
even when named or pathed differently. Match on purpose, not filename.

Rank each group by actual sophistication, not size. Weigh specificity of
instructions, handled edge cases, working bundled scripts, worked examples, and
how well the description would actually trigger the skill. Line count and
commit depth are supporting signals only — a long body can be padding and a
short one can be the origin that everything else forked from.

Report a table: skill group, which repositories have it, which version is
strongest, and what each repository uniquely contributes. Name the gaps in this
repository explicitly, including skills it does not have at all.

### 2. Compare one skill

Open every version end to end, including bundled `references/`, `scripts/`, and
`assets/`. Then extract a feature ledger: distinct, individually-adoptable
capabilities, each tagged with the repositories that have it.

Read for intent, not text. Two versions can implement the same capability with
different wording; the ledger records the capability. A feature is a validation
step, an error-handling rule, a bundled script, an encoded domain constraint, a
well-tuned trigger phrase, or a worked example that changes behavior.

Flag separately anything an older version encodes that a newer one dropped.
Losing an original constraint to a more polished rewrite is the most common way
this process destroys value.

### 3. Port

For each approved item:

1. Read this repository's current version of the target skill in full first. A
   feature already covered needs no edit, and a near-duplicate makes the skill
   worse.
2. Rewrite the feature for this repository — its real commands, real paths,
   real domain vocabulary, real examples. Source examples from this
   repository's actual code and content rather than inventing placeholders.
3. Port bundled resources by logic, not by copy. A sibling's script usually
   encodes its own paths and package manager.
4. Edit the canonical body under `skills/<name>/`, never a discovery pointer or
   adapter.
5. Update the frontmatter `description` last, once the body is settled, so the
   trigger conditions describe what the skill now actually does.
6. Keep each skill's body under 500 lines. If a port pushes it over, move
   conditional detail into `references/` rather than trimming the capability.

Keep ports to one skill per reviewable unit so each is separately reviewable.

### 4. Validate

- Regenerate discovery adapters with this repository's supported generator;
  never hand-edit an adapter.
- Run this repository's skill validation and skill tests.
- Confirm every relative link in a changed skill resolves.
- Re-read the pre-port inventory and confirm no capability the skill already
  had was lost in the merge.
- Draft two or three realistic prompts that should trigger each changed skill,
  and check the description would actually catch them.

## Deliverable

Report:

1. the workspace map the scan found, and which repositories were readable;
2. per skill group, the strongest version and what this repository is missing;
3. what was ported, and how it was adapted for this repository;
4. what was deliberately not ported, and why;
5. validation results; and
6. anything a sibling repository should adopt — as a recommendation for that
   repository's own session, since this skill will not write there.

## Completion criteria

- No sibling repository was modified.
- Every ported feature reads as though it was written for this repository.
- No instruction references a command, path, or script this repository lacks.
- Adapters were regenerated, and skill validation and tests pass.
- Nothing the skill previously did was lost.

## Resources

- [scripts/workspace_scan.py](scripts/workspace_scan.py) — read-only sibling
  discovery and skill inventory, derived from this repository's own location.
- [../improve/references/repository-profiles.md](../improve/references/repository-profiles.md)
  — stacks, package managers, and validation commands per repository.
- [../improve/references/review-conventions.md](../improve/references/review-conventions.md)
  — shared evidence and reporting rules.
