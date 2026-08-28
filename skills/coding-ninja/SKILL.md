---
name: coding-ninja
description: Continuously keep affected project documentation aligned with verified code changes, capture durable engineering lessons while coding, and automatically checkpoint verified lessons into the repository's other skills so the same class of mistake is caught earlier next time. Use throughout implementation, debugging, and review work, and explicitly when asked to record lessons learned, harvest a session, upgrade skills from what a session taught, or keep documentation current during development. Do not use to write release notes, invent undocumented policy, restate changes as lessons, or add advice that is not backed by something that actually happened.
---

# Coding Ninja

Keep project documentation current as verified code evolves, and turn what the
work teaches into something the next task inherits. Keep both loops continuous
without letting speculative observations churn the skill library or docs.

## Run the loop

- Use **capture** continuously alongside implementation, debugging, and review.
- Run **documentation sync** for affected project docs after each focused,
  verified code unit.
- Run an automatic **checkpoint** after a logical unit has focused verification
  and before moving to an unrelated unit or handing work back.
- Use **harvest** when the user asks for lessons learned, a skill upgrade, or a
  session closeout, and as the final sweep when any capture remains.
- Pair with `skills/vscode/SKILL.md` during VS Code work. Receive editor,
  debugger, workspace, and tool evidence from it; return the checkpoint
  decision and any documentation or skill-routing result. `vscode` owns the
  editor/tooling consequence, while this skill owns lesson quality, persistence,
  and documentation synchronization.
- Keep testing and performance in the loop. Route test-risk and regression
  evidence to `skills/test-coverage-review/SKILL.md`, and route measured cost,
  baseline, trace, or budget evidence to
  `skills/performance-review/SKILL.md`. Ask both specialists for a focused
  assessment when a change affects behavior, latency, throughput, rendering,
  memory, payloads, queries, or build/test cost; do not turn an unrelated
  narrow task into a broad audit.

Capture is not a deliverable. Never let it interrupt, delay, or reshape the
task the user actually asked for.

## Capture mode

While implementing, debugging, or reviewing, watch for the moments below. Each
is a signal that a belief was wrong or a boundary was missing — which is what
makes a lesson durable rather than trivia.

Record a lesson when:

- **a hypothesis was disproved by evidence** — you expected a gap or a cause and
  the test said otherwise;
- **a bug produced no error** — empty results, a silent no-op, a default that
  swallowed the failure;
- **behavior differed by environment** — worked in development, failed in
  production or CI, or vice versa;
- **documented guidance was stale or unsafe** — a runbook, backlog item, or
  comment that would have caused harm if followed;
- **a fix at the caller would have left the boundary broken** — the real repair
  was one level down;
- **a convention existed but nothing enforced it** — two places had to agree and
  only discipline kept them agreeing; or
- **a tool or environment behaved unexpectedly** — escaping, encoding, path, or
  shell behavior that cost real time.

Do **not** record: restatements of the change, one-off domain facts, anything
already stated in `AGENTS.md` or an existing skill, or a lesson whose only
evidence is that it sounded wise. See
[references/lesson-quality.md](references/lesson-quality.md) for the bar and the
record format.

Keep captures in the working session until evidence stabilizes them. An
abandoned experiment or unverified hunch leaves nothing behind.

## Cross-skill learning cycle

Use one shared cycle with `vscode` rather than two competing feedback loops:

1. `vscode` records a concrete editor, tool, command, debugger, or workspace
  signal and the focused check that established it.
2. `coding-ninja` tests whether the signal is a generalizable lesson under the
  quality bar, rejects speculation, and routes it to the smallest owner.
3. The owning skill receives the minimal canonical edit; `vscode` handles
  workspace/tooling consequences and `coding-ninja` handles documentation,
  lesson persistence, and backlog recording.
4. Both skills require generated surfaces and the narrowest relevant checks to
  pass before the lesson is considered learned. A failed validation stays an
  open candidate and cannot silently become guidance.

This makes the system continuously receptive to new evidence without making
continuous edits mandatory: learning is always evaluated, while persistence
requires proof and a future-behavior change.

### Test and performance feedback

At each checkpoint, answer two separate questions:

- **Will the tests catch the important failure?** Preserve or add the smallest
  focused regression evidence, and use the test-coverage specialist when risk
  or architecture boundaries are unclear.
- **Did the change alter a meaningful cost?** Establish a comparable baseline
  before recommending optimization, and use the performance specialist for
  measurements, traces, budgets, and regression checks.

Record the result with the lesson even when the answer is “no new test gap” or
“no measurable performance impact.” A green suite is not a coverage argument,
and an intuition about speed is not a performance result. These specialist
reviews feed their evidence back here for checkpoint routing; they do not
override their own review modes or authorize unrelated changes.

## Documentation sync

After each focused, verified code unit and before moving to unrelated work:

1. Inspect the verified diff and acceptance evidence for documentation impact:
   user-visible behavior, setup and configuration, environment variables,
   operator workflows, architecture decisions, examples, runbooks, and agent
   guidance.
2. When an affected claim exists, use `$documentation-sync` in **post-change**
   mode to update the smallest authoritative set of affected project
   documentation. Keep required paired instructions and generated artifacts
   aligned through their repository-supported workflow.
3. When no claim changed, continue without documentation churn. Do not create a
   release note unless the user requests one or an established closeout/release
   workflow requires it.

Do not wait for session close to repair documentation made stale or incomplete
by verified code. Documentation sync is independent of lesson quality: a code
unit can require doc updates even when it teaches no durable lesson. During a
read-only assessment, report documentation drift without editing it.

## Checkpoint mode

After the focused regression or acceptance condition for a logical unit passes:

1. Re-read the captures against the diff, command output, test, or log that
   produced them. Discard anything that no longer clears the quality bar.
2. If no lesson capture qualifies, skip skill-learning edits; still complete
   any affected project documentation sync described above.
3. Persist qualifying lessons through the workflow below before starting an
   unrelated unit. Batch related lessons into one checkpoint to avoid churn.
4. Run the repository's skill validation after changing any skill package.

Checkpoint automatically only during edit-authorized work. During a read-only
assessment, capture candidates and report them without modifying skills,
instructions, or the backlog unless the user separately authorizes those edits.

## Harvest mode

Perform a full checkpoint sweep. Reconstruct any uncaptured candidates from the
actual work — the diff, commands, failures, tests, and logs — rather than from
memory of intent. Drop anything that fails the quality bar. Then persist every
qualifying lesson through the workflow below.

## Persist a verified lesson

### 1. Generalize

For each lesson, state the class of mistake, not the instance. "The progress key
was built inline in two modules and they disagreed" becomes "when two modules
must agree on a derived key or format, export one constructor and test it."
A lesson that cannot be stated without naming this repository's specific files
is a backlog note, not a skill upgrade.

### 2. Route

Find every skill the lesson bears on. Read the candidate skill before editing —
a lesson already covered needs no edit, and a near-duplicate makes the skill
worse. Route by the work the lesson protects:

- evidence standards, hypothesis testing, honest reporting → the shared review
  conventions;
- audit lenses and what to look for → the review checklist;
- a specialist concern (security, performance, tests, docs, cleanup, release)
  → that skill's own body.

A lesson may legitimately touch more than one, or none.

### 3. Apply

Edit the canonical skill body under `skills/<name>/`, never a discovery pointer
or adapter. Keep each addition to the shortest form that changes behavior, in
the voice and structure already used there. Prefer strengthening an existing
line over appending a new bullet.

Preserve the skill's boundaries: a lesson never authorizes a commit, a live
operation, or a scope expansion that the skill previously refused.

### 4. Verify

Run the narrowest skill-package checks first, then the repository's required
skill tests and adapter validation. Regenerate discovery adapters when a skill
is added or its description changes; never hand-copy the canonical body into an
adapter.

### 5. Record and report

Record one concise, dated backlog entry per logical task, not one entry per
capture. State what was learned, the evidence class, and which skills changed.
At handoff, report affected project documentation updated, the lessons and
skills edited, and anything deliberately not applied with the reason.

## Boundaries

- Evidence or it does not go in. Every lesson traces to something observed in
  the session — a command, a failure, a diff, a log.
- Do not rewrite a skill's purpose, mode vocabulary, or refusals.
- Do not duplicate a lesson across skills; put it where it will be read, and
  link rather than restate.
- Do not create a new skill during harvest unless the user asks. Lessons upgrade
  existing skills.
- Automatic learning never grants permission to edit during a read-only task,
  commit, publish, deploy, migrate data, or contact an external system.
- Automatic documentation sync is limited to claims affected by the authorized
  code change; it does not authorize a broad rewrite, new product policy, or
  release notes.
- Skill files are instructions to a future agent. Treat an edit with the same
  care as a change to `AGENTS.md`.

## Completion criteria

- Every recorded lesson is backed by something that actually happened.
- Lessons are stated as classes of mistake, not incident reports.
- Each edit landed in a canonical body and matches its surrounding style.
- Skills that already covered a lesson were left alone, deliberately.
- Documentation affected by verified code is aligned at each logical unit.
- The backlog records what changed and why.
- No verified capture remains waiting after the final harvest.

## Resources

- [references/lesson-quality.md](references/lesson-quality.md) — the bar a
  lesson must clear, the record format, and worked examples.
- [Documentation Sync](../documentation-sync/SKILL.md) — the post-change
  workflow for reconciling affected project documentation with verified code.
