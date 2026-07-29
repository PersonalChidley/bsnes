---
name: replace-with-skill-name
description: Describe what the skill does and every request context that should trigger it. Include important non-triggers when adjacent skills could overlap.
---

# Replace with Skill Title

State the outcome in one or two sentences. Write instructions in imperative
form and include only information another capable agent would not reliably
infer.

## Select the mode

Define modes only when they preserve one primary responsibility and output
contract. State the safe default when the request is ambiguous.

## Establish inputs

- List inputs the agent should discover from the request or repository.
- Identify inputs that genuinely require user direction.
- Define defaults without hiding consequential assumptions.

## Preserve boundaries

- State what the skill must not change or decide.
- Preserve repository governance, authorization, existing work, and secrets.
- Identify adjacent skills or specialist reviews this skill does not replace.

## Run the workflow

### 1. First verifiable stage

Describe the action, required evidence, and stopping condition.

### 2. Next stage

Keep stages ordered when later work depends on earlier artifacts.

### 3. Produce deliverables

Define paths only when they are stable across target repositories. Otherwise
define artifact types and let repository conventions select paths.

## Validate

- Define structural and behavioral checks.
- Require honest reporting of unavailable, skipped, and failed checks.
- Inspect the final diff when the skill permits edits.

## Completion criteria

- List observable conditions, not aspirations.
- Include required deliverables and evidence.
- Confirm that boundaries remained intact.

## Resources

Link every optional resource directly from this file and state when to read or
run it. Delete this section when no resources are needed.
