---
name: session-budget
description: Report the remaining Claude Code usage block budget and, when it is nearly exhausted, write a durable handoff checkpoint so work can be resumed cleanly in the next window. Use before starting a long or risky unit of work, at a verified checkpoint, or when the user asks how much session budget is left or wants a resumable stopping point. Do not use to sleep, poll, block a turn, or automatically resume paused work.
---

# Session Budget

Answer one question before committing to a unit of work: is there enough of the
current usage window left to finish it and verify it? Report the answer, and
when the answer is no, stop at a resumable point rather than mid-change.

This skill is passive. It reports and checkpoints. It never waits for a window
to reset and never restarts work on its own.

## Establish inputs

- The size of the work about to start: a one-file fix, a multi-file change, or
  a change requiring migration plus lint, typecheck, and tests.
- The active usage block, from
  [scripts/session_budget.py](scripts/session_budget.py).
- The repository's existing handoff surfaces: `docs/improvement-backlog.md`,
  session memory, and the checkpoint conventions in
  [../coding-ninja/SKILL.md](../coding-ninja/SKILL.md).

## Preserve boundaries

- Never sleep, poll on a timer, or hold a turn open waiting for a reset. A
  blocked turn consumes the budget it is trying to protect.
- Never schedule, launch, or resume an agent run. Resumption is the user's
  decision, made in a new session.
- Never treat the usage report as authoritative. It reconstructs an unofficial
  local format, and the inferred limit is a guess from prior blocks. Report it
  as an estimate.
- Fail open. Missing, unreadable, or unrecognized usage data means proceed with
  the work, not stop it.
- Do not raise this mid-change unless the budget reading crossed the stop
  threshold. Interrupting verified work to write a checkpoint that was not
  needed is worse than finishing it.

## Run the workflow

### 1. Read the active block

Run from this skill directory:

```text
python scripts/session_budget.py
```

The report contains `recommendation` (`proceed`, `checkpoint`, or `stop`),
`usedPercent`, and the active block's `minutesRemaining`. Thresholds are
adjustable with `--warn-percent` and `--stop-percent`; the plan's real limit can
be supplied directly with `--token-limit` when it is known.

Read the recommendation against the size of the work, not in isolation:

| Recommendation | Meaning |
| --- | --- |
| `proceed` | Start the work as planned. |
| `checkpoint` | Finish and verify the current unit. Do not begin a new multi-file change. |
| `stop` | Do not start new work. Write the handoff and report. |

`minutesRemaining` is secondary. A block resetting soon is good news, not a
reason to stop; only a nearly exhausted token budget is.

### 2. Report plainly

State the estimate, its uncertainty, and the consequence for the requested
work. One or two sentences, not a table dump. If the recommendation is
`proceed`, say so and continue immediately without further ceremony.

### 3. Write a handoff when stopping

Only on `stop`, or on `checkpoint` when the user asks for a stopping point.
Bring the working tree to a coherent state first: finish the in-flight edit,
run `npm run lint`, `npm run typecheck`, and `npm run build`, and record their real results.

Write the handoff to `docs/improvement-backlog.md` as a dated task entry
containing:

- the goal, in one sentence;
- files already changed and whether each is verified;
- the exact next step, specific enough to act on without re-deriving it;
- the commands that must pass before the work is considered complete; and
- any decision that was made but not yet written into code or documentation.

Do not invent a new handoff file, a status dashboard, or a resume protocol.
The backlog is the repository's existing shared memory.

### 4. Hand back

Report the estimated remaining budget, what was completed and verified, where
the handoff was written, and the single next step. Then stop. Do not offer to
wait, watch, or continue later.

## Report

Close with a short summary covering:

- the estimated block budget remaining and that it is an estimate;
- the recommendation and what it changed about the plan;
- verification results for anything completed; and
- the handoff location, when one was written.
