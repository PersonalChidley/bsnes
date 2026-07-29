---
name: release-notes-on-session-end
description: Write or update today's plain-language bsnes development notes when a working session ends. Use when the user says "end session", "wrap up", "that's all for today", or explicitly asks for session or release notes. Record user-visible and maintainer-relevant changes, validation, and material limitations; skip the file when nothing meaningful changed.
---

# Release notes on session end

Record meaningful session outcomes for bsnes maintainers without overstating
browser-port readiness.

## Establish inputs

- Use today's date for `docs/release-notes/YYYY-MM-DD.md`.
- Derive changes from the current session and diff, not Git history alone.
- Read the current status in `README.md` and `docs/web-port.md`.

## Preserve boundaries

- Skip the note when nothing user-visible or maintainer-relevant changed.
- Append a distinct session entry when today's file already exists; do not
  overwrite other work.
- Do not describe a Wasm build as playable without a legal-ROM runtime test.
- Do not mention ROM names, hashes, save data, secrets, or private local paths.
- Distinguish completed work, validation performed, and checks that were
  unavailable or blocked.

## Write the entry

- Use plain language understandable to users and maintainers.
- Group related changes under short headings.
- Explain practical impact rather than listing implementation details.
- Include a concise validation and limitations section when relevant.
- Match the style of existing files in `docs/release-notes/`.

## Validate

- Confirm the date and target path.
- Confirm every claim is supported by the session's work or validation output.
- Confirm status agrees with `README.md` and `docs/web-port.md`.
- Confirm an existing same-day file was appended rather than overwritten.

## Completion criteria

Today's note accurately records meaningful changes and limitations, or the
skill was deliberately skipped because there was nothing worth recording.
