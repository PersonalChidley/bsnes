# Release mechanics profiles

Verified release mechanics for this repository. Read the repository's current
instructions and manifests first; current evidence overrides this file.

## bsnes Web Port

- **Root marker:** `package.json` name `bsnes-web`, with the C++ core under `bsnes/`
- **Version source:** `package.json` for the browser shell only. The emulator core carries its own upstream versioning; do not conflate the two.
- **Release registry:** none is established. Do not create one or treat the
  backlog as release notes.
- **Release policy:** request an exact target and confirmation that package
  metadata is the intended application version before editing.
- **Documentation:** update only current-version claims that actually exist.
- **Checks:** `npm run check` (lint, typecheck, and build). There is no test suite to run.
