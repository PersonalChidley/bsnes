# AI Engineering Skills Framework

This directory is the repository-owned source of reusable AI engineering
workflows for bsnes and its incremental browser port. Specialist review skills
remain portable; coordinating and session-recording workflows may contain
bsnes-specific policy references.

A skill is procedural guidance, not a second project policy. Repository
governance, user authorization, accepted decisions, and safety controls always
take precedence.

To transplant this framework into another repository, follow
[IMPLEMENTATION.md](IMPLEMENTATION.md). It covers minimal and full adoption,
project-specific adaptation, assistant discovery, validation, and smoke tests.

## Package structure

Each implemented skill is a package:

```text
skills/
|-- IMPLEMENTATION.md
|-- README.md
|-- TEMPLATE.md
`-- improve/
    |-- SKILL.md
    |-- agents/
    |   |-- claude-code.md
    |   `-- openai.yaml
    `-- references/
        |-- output-contracts.md
        `-- review-checklist.md
```

`SKILL.md` is the portable source of workflow behavior. It has YAML frontmatter
with only `name` and `description`, followed by concise imperative
instructions. Optional resources belong in:

- `agents/` for assistant-specific interface metadata, never workflow policy;
- `references/` for detailed material loaded only when needed;
- `scripts/` for repeated deterministic operations; and
- `assets/` for templates or files copied into outputs.

Do not add empty resource directories, per-skill READMEs, changelogs, or
duplicated quick-reference files.

## Naming and discovery

- Name packages with lowercase letters, digits, and hyphens.
- Prefer short, action-oriented names such as `improve`.
- Keep the package name equal to the frontmatter `name`.
- Do not add numeric prefixes. A skill name is a stable invocation identifier,
  not a display order or dependency declaration.
- Put all trigger conditions in the frontmatter `description`; an assistant
  decides whether to load the body from that metadata.

The top-level `skills/` tree is canonical even when an assistant uses a
different discovery location. Configure a thin adapter or invoke the package by
path for that assistant; do not maintain copied workflow bodies.

Example invocations:

```text
Use $improve in assess mode and report repository health.

Use $improve in loop mode to run one improvement-loop iteration: scan a focus
area, fix the top backlog items, verify, and record.
```

## Design rules

Create a skill only when a workflow is reusable, has one primary problem, and
benefits from more consistency than a one-off prompt provides. A good skill:

- declares its outcome, inputs, boundaries, deliverables, and completion test;
- uses repository evidence rather than hidden assumptions;
- produces stable output contracts where practical;
- preserves architecture and authorization boundaries;
- separates deep specialist review from broad triage;
- explains significant recommendations;
- composes through artifacts instead of shared hidden state; and
- avoids commits, pushes, publication, or live operations unless the user
  explicitly authorizes those actions and repository policy allows them.

Do not create a new skill merely for a new technology name or minor variation.
Extend an existing skill when its primary responsibility and output contract
remain the same. Split a skill when its modes require different expertise,
authority, evidence, or deliverables.

## Composition

Compose skills by declaring:

1. execution order;
2. artifact passed from one skill to the next;
3. which skill owns the final decision or deliverable; and
4. conflict resolution under repository governance.

Run narrow evidence-producing skills before a coordinating skill when a deep
review is already required. For example, a future security review may produce
findings that `improve` (in assess mode) deduplicates and prioritizes. The
coordinator must not alter the specialist's evidence or severity silently.

Avoid two skills editing the same artifact in parallel. If multiple skills
recommend changes to one document, nominate a final synchronization owner and
preserve unresolved conflicts explicitly.

## Lifecycle and versioning

1. Define realistic trigger examples and non-triggers.
2. Copy [TEMPLATE.md](TEMPLATE.md) into a named package as `SKILL.md`, or use an
   assistant's supported skill initializer.
3. Add only the references, scripts, assets, and metadata the workflow needs.
4. Validate package structure and all bundled scripts.
5. Forward-test material skills on a clean, realistic task without leaking the
   intended answer.
6. Review the resulting artifacts and tighten unclear behavior.
7. Evolve the skill from observed use, keeping its responsibility stable.

Use Git history as the default version record. Add an explicit output-contract
version only when automation or external consumers require compatibility
management. In that case, document migration behavior and keep old contracts
available for their stated support period; do not add arbitrary version fields
to the `SKILL.md` frontmatter.

## Catalog

| Skill | Status | Primary responsibility |
| --- | --- | --- |
| `improve` | Implemented | Improve bsnes and its browser port in one recorded iteration, or perform a read-only repository health assessment |
| `release-notes-on-session-end` | Implemented | Write or update plain-language bsnes development notes when a session ends |
| `architecture-review` | Candidate | Evaluate conformance and surface decisions without redesigning |
| `documentation-sync` | Implemented | Reconcile documentation after source-of-truth decisions |
| `release-readiness` | Candidate | Assess a defined release against explicit gates |
| `test-coverage-review` | Implemented | Map important behavior and risk to test evidence |
| `security-review` | Implemented | Perform a deeper threat- and trust-boundary review |
| `performance-review` | Implemented | Measure and explain performance risks |
| `project-cleanup`    | Implemented | Find unused or stale files and plan a recoverable, explicitly approved cleanup |
| `version-bump`       | Implemented | Prepare a release at an explicit semantic version using the repository's real version source |
| `end-session`        | Implemented | Coordinate release choice, notes, documentation, checks, and an authorized handoff |
| `coding-ninja`       | Implemented | Capture durable engineering lessons and checkpoint them into the other skills |
| `vscode`             | Implemented | Keep the VS Code workspace correct and hold editor work to a senior engineer's bar |
| `session-budget`     | Implemented | Report the remaining usage block and write a resumable handoff when it runs low |
| `workspace-sync`     | Implemented | Compare skills across sibling repositories and port an approved improvement in |
| `refactoring-review` | Candidate | Propose behavior-preserving simplifications |
| `backlog-grooming` | Candidate | Deduplicate and prepare an existing backlog for decisions |
| `dependency-review` | Candidate | Review dependency need, risk, licensing, and update posture |

Candidates are not invocable skills. Implement one only after its boundary,
examples, outputs, and relationship to existing skills are clear.
