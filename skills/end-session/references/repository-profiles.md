# Repository closeout profiles

Session-closeout capabilities and safe handoff paths for this repository. Read
the repository's current instructions first; they override this file.

## bsnes Web Port

- **Marker:** `package.json` name `bsnes-web`, with the C++ core under `bsnes/`
- **Release decision:** no formal application release policy or structured
  release registry is established. Keep package metadata unchanged unless the
  user separately defines and requests a release.
- **Session record:** return the session summary and update `README.md`, `AGENTS.md`, `docs/web-port.md`, or `docs/improvement-backlog.md` only when their current claims or tracked work changed. `AGENTS.md` and `docs/web-port.md` are the handoff contract — keep them accurate.
- **Checks:** `npm run lint`, `npm run typecheck`, and `npm run build`.
- **Privacy:** do not include ROM filenames, save-state contents, or any user file data in a note or example.
- **Handoff:** no repository-owned external session-post path is established.
  Return a concise local handoff and do not infer email, chat, ticket, commit,
  push, or deployment authorization.
