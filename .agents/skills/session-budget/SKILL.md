---
name: session-budget
description: Report the remaining Claude Code usage block budget and, when it is nearly exhausted, write a durable handoff checkpoint so work can be resumed cleanly in the next window. Use before starting a long or risky unit of work, at a verified checkpoint, or when the user asks how much session budget is left or wants a resumable stopping point. Do not use to sleep, poll, block a turn, or automatically resume paused work.
---

Read and follow the canonical [session-budget skill](../../../skills/session-budget/SKILL.md).
Edit the canonical package, not this discovery adapter.
