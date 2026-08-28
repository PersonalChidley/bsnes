---
name: vscode
description: Set up and keep correct the VS Code workspace for the bsnes web port — tasks, launch configs, recommended extensions, and settings spanning a C/C++ emulator core and a Next.js browser shell — and hold implementation, debugging, and review work done in that editor to a senior software engineer's bar: the debugger over console-log archaeology, the repository's real lint/typecheck/build commands over memory of what should pass, and a scoped, evidence-backed diff over a quick patch. Use throughout every coding and debugging session in VS Code, and explicitly when asked to add or fix a task or launch config, recommend extensions, improve skill/tool coverage, or diagnose an editor or terminal environment problem such as a missing Emscripten SDK, a stale WASM artifact, C/C++ IntelliSense that cannot resolve core headers, or a stuck TypeScript server. Pairs continuously with coding-ninja, which captures the lessons and documentation updates this work produces. Do not use to decide product or architecture policy, to rewrite emulation logic in TypeScript, or to bypass the repository's own lint, typecheck, or build gates.
---

# VS Code

Keep the VS Code workspace for this repository correct — tasks, launch
configs, recommended extensions, and settings — and hold implementation and
debugging work done in that editor to a senior engineer's bar: the debugger
over console-log archaeology, the repository's real check commands over
memory of what should pass, and a scoped, evidence-backed diff over a quick
patch. This skill keeps the editor honest; `$coding-ninja` keeps the
documentation and lessons that work produces. Neither substitutes for the
other.

**This repository has no test runner.** There is no Vitest, no Jest, and no
`test` script. "The checks passed" here means lint, typecheck, and a
successful build — never describe it as a passing test suite. It also spans
two toolchains: a C/C++ emulator core under `bsnes/` and a Next.js browser
shell at the root. Accuracy of the core is the product; a change that speeds
it up but alters timing is a regression, not an optimization.

## Pair with coding-ninja

- Every coding, debugging, or review task carried out in VS Code uses this
  skill and `$coding-ninja` together, the same way `$coding-ninja` already
  pairs with `$documentation-sync`. This skill supplies the editor mechanics
  and the implementation standard; `$coding-ninja` captures the lessons and
  keeps affected documentation aligned as the work proceeds.
- Use **workspace setup** whenever `.vscode/` is missing, or has drifted from
  the repository's real `package.json` scripts, a newly-needed extension, or
  a changed dev port.
- Apply the **implementation standard** by default for every task written or
  debugged in the editor — it needs no separate invocation.
- Use the **debug workflow** whenever a failure needs root-causing rather
  than a first guess.

### Mutual handoff contract

At the end of each focused, verified unit, hand the observed editor/tooling
evidence to `$coding-ninja`: what happened, how it was verified, whether it
generalizes, and which documentation or skill owns the change. Receive back
the checkpoint decision before starting an unrelated unit. `$coding-ninja`
decides whether a lesson clears the evidence bar and persists it; this skill
decides whether the lesson requires a workspace, tool, debugging, or skill
coordination change. Neither skill edits the other's ownership surface.

## Skill and tool stewardship loop

Act as the senior engineer manager for the repository's skills and editor
tools. Improve the system from evidence; do not invent policy or upgrade
configuration merely because a newer option exists.

1. **Inventory** the canonical `skills/*/SKILL.md` packages, the discovery
  adapters under `.agents/skills/` and `.claude/skills/`, `.vscode/*`, and the
  `package.json` scripts the current task depends on. Canonical bodies and
  manifests are the sources of truth; both adapter layers are derived.
2. **Detect** a concrete gap: repeated manual recovery, a failed or misleading
  tool configuration, a documented rule that did not guide the work, or a
  missing skill boundary. Record the command, failure, diff, or runtime state
  that proves it before proposing an upgrade.
3. **Route** the gap to the smallest owning skill. Put evidence and lesson
  quality in `coding-ninja`, review evidence in shared review guidance,
  cross-repository technique transfer in `workspace-sync`, and
  editor/task/debugging mechanics here. Do not duplicate a rule across skills;
  link to the existing owner when it already covers the behavior.
4. **Upgrade** the canonical skill or workspace source only when the change
  would alter future agent behavior. Keep the smallest reviewable edit, avoid
  dependency or architecture changes, and preserve every skill's refusal and
  scope boundaries.
5. **Regenerate and verify** the discovery adapters, then run
  `npm run check` (lint, typecheck, and build). Re-run the focused repository check that exposed the gap when
  available. An improvement that cannot be verified remains a `docs/improvement-backlog.md`
  candidate, not a completed upgrade.
6. **Review the loop** at session close: discard hunches, retain only lessons
  backed by evidence, update affected documentation, and leave one concise
  `docs/improvement-backlog.md` record for the logical improvement. Never silently rewrite
  unrelated skills or workspace settings.

This is a feedback loop: observed failure or drift -> evidence -> owning skill
-> minimal upgrade -> generated surfaces -> validation -> next-session
behavior. `$coding-ninja` remains the authority for lesson capture and harvest;
this skill owns the editor/tooling consequences and coordinates their checks.

## Workspace setup

`package.json`'s `scripts` block is the only source of truth for what a task
or launch config runs — never hand-guess a command or carry one over from
memory, since a stale task drifts silently the moment a script is renamed and
nothing else notices.

1. Generate `.vscode/tasks.json` from the current scripts: `dev`, `lint`,
   `typecheck`, `build`, and `check`. Make `check` the default build task and
   give `lint` and `typecheck` a `problemMatcher`. Add `core:build` as a
   separate, clearly-labelled task — it shells out to
   `node scripts/build-core.mjs` and needs the Emscripten SDK on PATH, so it
   is not part of ordinary validation and should never run automatically.
2. Generate `.vscode/launch.json` with a Next.js dev-server config and a
   Chrome/Edge attach config for debugging the browser shell. There is no test
   runner to launch. Use the repository root as the working directory, spelled
   with its real drive-letter case (`C:\DEV\bsnes`, not `c:\...`).
3. Generate `.vscode/extensions.json` recommending ESLint for the shell and
   the C/C++ extension for the core. Do not recommend a database, ORM, or auth
   extension — this repository has none of those. Do not add a second
   formatter that would reformat vendored emulator source.
4. Generate `.vscode/settings.json`: pin `typescript.tsdk` to
   `node_modules/typescript/lib`, and exclude `.next`, `node_modules`, and the
   Emscripten build output from search and file-watcher scope. Set
   `files.associations` so headerless C++ sources under `bsnes/` resolve, and
   scope any format-on-save rule to the TypeScript shell only — automatic
   formatting of `bsnes/`'s vendored core produces enormous diffs that bury the
   actual change and make upstream comparison impossible.
5. Keep the C/C++ IntelliSense include path pointed at the real core layout
   (`bsnes/sfc/`, `bsnes/emulator/`, `bsnes/processor/`, `libco/`). When it
   cannot resolve a header, that is a configuration problem, not a missing
   file — do not "fix" it by adding an include the build does not use.

## Implementation standard

- Run the repository's real check commands — `npm run lint`,
  `npm run typecheck`, and `npm run build`, or `npm run check` for all three —
  after a change. There is no test suite; say so plainly rather than implying
  one ran.
- **Do not rewrite emulation logic in TypeScript.** CPU, PPU, SMP/APU,
  cartridge, timing, and serialization behavior stay in C/C++ under `bsnes/`.
  The Next.js application is a frontend. A TypeScript reimplementation of core
  behavior is out of scope no matter how small it looks in the editor.
- Treat `bsnes/target-web/` as the browser C ABI boundary. A change on either
  side of it needs the other side checked; the editor will not tell you the
  ABI drifted, because one side is C and the other is TypeScript.
- Rebuild the core with `npm run core:build` only when the C/C++ actually
  changed, and confirm the Emscripten SDK is on PATH first. A stale `.wasm`
  next to fresh TypeScript is the most confusing state this repository can be
  in — the shell compiles, the app loads, and behavior is from the old core.
- Keep `AGENTS.md` and `docs/web-port.md` current whenever an architectural
  decision, build prerequisite, known blocker, or validation command changes.
  Both files are the explicit handoff contract for future sessions.
- Keep each change scoped to one reviewable unit; resist an opportunistic
  refactor or drive-by rename picked up only because a file was already open
  for an unrelated fix.
- Prefer the debugger — a breakpoint in the shell, or the browser's WASM
  debugger for core interaction — over `console.log` archaeology for anything
  past a one-line fix.
- Because there is no regression suite, a behavior change needs a stated,
  reproducible manual verification: which ROM or scenario, what was observed
  before, and what was observed after. Record it rather than asserting the fix
  works.

## Debug workflow

1. Reproduce the failure through the actual failing scenario in the browser — there is no test suite to reproduce it in before forming a hypothesis, not by
   reading the code and guessing.
2. Check the failure signature against the known environmental landmines
   below before treating it as a logic bug. Treating an environmental symptom
   as a logic bug wastes a debugging pass and can produce a fix that papers
   over nothing.
3. Attach the debugger at the boundary closest to the reported symptom
   rather than the caller several layers up; the correct fix usually lives at
   the boundary that actually owns the failure, not the one that happened to
   surface it.
4. Fix at that boundary, record a reproducible manual verification of the fix, and verify through the same task or launch
   config that reproduced the failure in step 1.
5. Hand the verified lesson and any documentation impact to `$coding-ninja`
   checkpoint mode before moving to unrelated work.

### Known environmental signatures

- **The shell builds and runs, but behavior matches the old core** — a stale
  `.wasm`. The TypeScript rebuilt; the core did not. Run `npm run core:build`.
- **`npm run core:build` failing immediately** — the Emscripten SDK is not on
  PATH. This is an environment problem, not a source problem; do not start
  editing the C++.
- **C/C++ IntelliSense cannot resolve a core header** — the include path in
  `.vscode/settings.json` is wrong. Fix the configuration; do not add an
  include the actual build does not use.
- **An enormous diff touching vendored emulator source you did not edit** —
  format-on-save is scoped too broadly. Restrict it to the TypeScript shell
  and revert the reformatting.
- **`next build` failing its typecheck step with "Cannot find module
  '.../page.js'" naming an App Router page you just renamed or deleted** — a
  stale `.next/types/validator.ts` still lists the old route. Delete `.next`
  and rebuild before trusting the failure.
- **A native Windows binary invoked from the Bash tool throwing `ENOENT` on a
  path that looks correct in Bash** — a POSIX-looking path (`mktemp -d`
  output, anything starting with a bare `/`) is not translated when handed to
  a native process as an argument; `/tmp/xyz` resolves to `C:\tmp\xyz`.
  Construct the Windows-style path explicitly.

## Preserve boundaries

- Editor and workspace configuration changes are not product changes: do not
  let a `.vscode/` update carry an unrelated dependency bump, script rename,
  or behavior change along with it.
- Do not weaken or bypass a lint, typecheck, or build gate to make a task
  pass; fix the code, or if the rule itself is wrong, raise that as its own
  scoped change with the decision owner.
- Never let a workspace change reformat, restructure, or "modernize" the
  vendored emulator core. It is compared against upstream.
- Do not describe lint, typecheck, and build as a passing test suite. This
  repository has no tests, and claiming otherwise misreports the evidence.
- Follow the [shared review conventions](../improve/references/review-conventions.md)
  for evidence standards and honest reporting whenever this skill's work
  overlaps a review task.

## Deliverable

Report:

1. workspace files added, regenerated, or left unchanged, and why;
2. the check commands run and their results;
3. for a debugging session: the confirmed root cause, the boundary fixed, and
   the manual verification recorded, since there is no test suite; and
4. lessons or documentation impact handed to `$coding-ninja`.

## Completion criteria

- `.vscode/tasks.json`, `launch.json`, `extensions.json`, and `settings.json`
  match the repository's real scripts and toolchain, with no drift.
- No environmental symptom was mistaken for a logic bug, or the reverse.
- No emulation logic moved from C/C++ into TypeScript.
- Any core change was rebuilt and verified against a stated scenario, not
  assumed from a green build.
- `$coding-ninja` ran throughout and captured anything durable that the
  session's editor or debugging work taught.
