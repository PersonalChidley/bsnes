# Session-note profiles

Release-note and documentation destinations for this repository. Read the
repository's current instructions first; they override this file.

## bsnes Web Port

- **Marker:** `package.json` name `bsnes-web`, with the C++ core under `bsnes/`
- **Structured registry:** none is established.
- **Record behavior:** return the session summary and update `README.md`, `AGENTS.md`, `docs/web-port.md`, or `docs/improvement-backlog.md` only when their current claims or tracked work changed. `AGENTS.md` and `docs/web-port.md` are the handoff contract — keep them accurate.
- **Audience:** people running the emulator in a browser. Describe what now works, what got more accurate, and what is still unsupported.
- **Privacy:** do not include ROM filenames, save-state contents, or any user file data in a note or example.
- **Validation:** check changed links and examples, then run `npm run lint`, `npm run typecheck`, and `npm run build` when
  code-adjacent guidance changed.
