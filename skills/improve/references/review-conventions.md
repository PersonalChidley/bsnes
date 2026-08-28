# Shared review conventions

The specialist review skills — `security-review`, `performance-review`,
`test-coverage-review`, and `documentation-sync` — share the general
conventions below. This file is their single canonical statement. Each skill
links here and then adds only its own domain-specific boundaries and steps; it
does not restate these rules.

These are conventions, not policy. `AGENTS.md` and any repository-wide
development standard still govern, and a skill never authorizes a commit,
publish, or live operation.

## Mode vocabulary and the read-only default

- Each review skill offers a read-only assessment mode, an optional
  change-focused mode for a named diff or artifact, and an edit-capable mode
  used **only** when the user explicitly authorizes changes.
- **Default to the read-only mode when edit authorization is unclear.** Do not
  edit, remediate, optimize, strengthen, or synchronize without explicit
  authorization for that action in this session.
- Repository access never implies authorization to probe deployed systems,
  third parties, or accounts.

## Evidence and honest reporting

- Separate **verified** evidence from **inferred** or hypothesized risk, and
  label which is which.
- Trace a claim to direct evidence — implementation, tests, plans, traces, or
  accepted decisions — before reporting it. Search results alone are not proof.
- Check a claim about framework, library, or tooling behavior against the
  installed artifact or a real run of the gate, not against recollection. That
  behavior is version-specific, and both a suspected gap and a suspected cause
  are usually confirmable in minutes. State the finding either way — a
  hypothesis you disproved is a result worth reporting, not a step to hide.
- Re-validate documented remediation before following it. A runbook, backlog
  item, or comment describes the code as it was; confirm the steps are still
  safe against the code as it is, and say so when they are not.
- Invent no metrics. Report only measurements actually taken, with the command,
  environment, and inputs needed to reproduce them; do not compare numbers
  gathered under materially different conditions as if equivalent.
- Report skipped, unavailable, and failed checks honestly, along with tool
  limits and untested assumptions. Never infer success from the absence of an
  error.
- Validate with an instrument that can actually observe the failure you are
  guarding against. A check that is structurally blind to a regression returns
  green while the regression lands, and the green reads as proof. Ask what
  this check would look like if the thing I fear had happened — if the answer
  is "the same", it is not evidence. **Absence is the common blind spot:**
  suites, linters, and builds all report on what exists, so removed coverage,
  a dropped guard, a deleted branch, or an edit that never landed at all
  passes silently. The diff is the only instrument that sees them. This
  includes your own batch edits: a script that applies several replacements
  must **assert** each anchor matched, not count how many did and print the
  total. A printed count is reporting, not validation — the run that says
  "2 of 3" looks like every successful run unless something reads it, and the
  missing third change is invisible to every other gate. Assert per anchor, or
  re-read the result and grep for the text you expected to add.
- Treat a whole-file write to a path you have not read as destructive. Inferring
  "this file does not exist" from an earlier listing or search that never
  covered its directory is a guess, and the write leaves no error behind when
  the guess is wrong. Confirm the exact path first, and read the resulting diff
  rather than the tool's success.
- Treat a timed-out or interrupted mutating command as an unknown outcome, not
  a failure. Inspect authoritative state before retrying or reporting it.
- Read a failure that names a generated artifact — build output, generated
  types, a lockfile — as a staleness signal until proven otherwise. Regenerate
  or clear it and re-run before treating it as a source defect.
- Treat the operation a user names as the trigger of a failure as a hypothesis,
  not a fact, whenever several independent operations report through one
  shared error surface (a `Promise.all` of separate uploads or writes
  surfacing one banner, one log line covering a batch). Enumerate every
  operation folded into that surface and trace which one actually threw
  before spending further effort on the named one.
- Treat a stated cause carried in a backlog entry, TODO, or prior handoff note
  as a hypothesis recorded at one moment, not as an established finding. The
  author may have inferred it without checking history. Re-derive the cause
  from version control or the current code before acting on the remedy the
  entry proposes — the proposed remedy can be wrong in a way that destroys
  working behavior (removing a "stale" assertion for a feature that was only
  renamed, not retired).
- Never batch a full or heavy test-suite run in the same parallel step as
  another CPU-intensive verification command (lint, typecheck, build).
  Worker contention on a resource-sensitive suite can produce a broad,
  unrelated failure spike — mock call-count mismatches, environment setup
  errors — that reads exactly like a regression across many files at once.
  Treat a sudden broad-spectrum failure that appears only when the suite ran
  alongside another heavy command as a contention signal, not a defect: rerun
  the suite alone before reporting it.
- Do not author byte-level or escape-sensitive content through a shell
  heredoc. Escape handling varies by tool and platform, and the corruption
  surfaces later as an unrelated parse error in the written file. Build such
  content programmatically in the target language and verify the bytes on
  disk.
- Give findings a confidence level and order them by real impact rather than
  raw volume or percentage.

## Boundary preservation

- Preserve unrelated work; make one scoped change at a time and avoid
  opportunistic refactors or style-only rewrites.
- Treat a command's working directory as part of its input. Shell state does not
  reliably persist for a whole session, and in a multi-repository workspace a
  mistargeted package-manager command rewrites a *different* project's
  dependency tree without ever reporting an error. Pin the target in the same
  invocation — `pnpm --dir`, `npm --prefix`, an absolute schema or config path —
  rather than trusting an earlier `cd`.
- Do not change product behavior, configuration, schemas, dependencies, or
  architecture merely to satisfy the review.
- Do not resolve a product, security, or architecture ambiguity by choosing a
  policy. Record the conflict and the owner who must decide it.
- Keep testing non-destructive and local; never run load tests, submit
  payloads, or exercise external or production systems without explicit
  authorization for a precise target and method.
- Never expose, copy, or print secrets or private data, and never introduce
  them into examples, tests, or reports.
- When authorized to change code, fix the correct boundary rather than only the
  visible caller, add a focused regression test for each behavior change, and
  inspect the final diff for unintended effects.

## Continuous learning

- Use `$coding-ninja` in capture mode throughout review and implementation.
- In an edit-capable mode, checkpoint verified, generalizable lessons after the
  focused validation for each logical unit. In a read-only mode, retain and
  report candidates without editing skills, instructions, or backlogs.
- A green check alone is not a lesson. Persist only evidence that corrected a
  belief, exposed a missing boundary, or would materially change future work.
