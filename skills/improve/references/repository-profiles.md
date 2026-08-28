# Repository profiles

Use this profile only after reading the repository's current instructions and
manifests. Commands and invariants in the repository override this file.

This profile describes only this repository. Sibling repositories in the
workspace maintain their own; use `$workspace-sync` to compare across them
rather than copying another project's profile in here.

## bsnes Web Port

- **Root:** `C:\DEV\bsnes`
- **Marker:** `package.json` name `bsnes-web`, with the C++ core under `bsnes/`
- **Package manager:** npm. `package-lock.json` is the lockfile.
- **Governance:** `AGENTS.md` is canonical and is an explicit handoff contract for future sessions; read `README.md` and `docs/web-port.md` before changing the web port. `docs/improvement-backlog.md` is the loop's durable memory. Update `AGENTS.md` and `docs/web-port.md` whenever an architectural decision, build prerequisite, known blocker, or validation command changes.
- **Baseline:** run `npm run lint`, `npm run typecheck`, and `npm run build` — or `npm run check`, which chains all three. **There is no test runner in this repository**, so treat "the checks passed" as meaning lint, types, and a successful build only; never describe it as a passing test suite. Emscripten core rebuilds go through `npm run core:build` and need the Emscripten SDK on PATH; they are not part of ordinary validation.
- **Fragile boundaries:** **do not rewrite emulation logic in TypeScript.** CPU, PPU, SMP/APU, cartridge, timing, and serialization behavior stay in C/C++ under `bsnes/`; the Next.js application is a frontend only. `bsnes/target-web/` is the browser C ABI and Emscripten link target, and `libco/` provides the cooperative threading the emulation scheduler depends on. Accuracy is the product — a change that speeds up the core but alters timing is a regression, not an optimization.
- **External systems:** Vercel for the browser shell. No auth provider, no database, and no object storage. Do not add one to satisfy a skill's suggestion.
