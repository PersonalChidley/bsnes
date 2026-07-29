---
name: improve
description: Review and improve the bsnes repository and its incremental browser port. Run one improvement-loop iteration that scans a focus area, fixes the highest-priority actionable items, verifies them, and records the result, or perform a read-only repository health assessment across emulation correctness, web architecture, security, performance, documentation, and tests. Use when the user says "/improve", "run the improvement loop", "what should we fix next", "assess the repo", "run a health check", asks how healthy or release-ready the repository is, or requests recurring maintenance.
---

# Improve bsnes

Improve bsnes without compromising the accuracy or ownership boundaries of the
native emulator. Treat `AGENTS.md` as repository policy,
`docs/web-port.md` as the browser-port engineering record, and
`docs/improvement-backlog.md` as the improvement loop's memory.

## Select the mode

- Use **loop** for one iteration: orient, scan one focus area, fix a reviewable
  set of the highest-priority actionable findings, verify, and record.
- Use **assess** for a read-only health review using
  [references/review-checklist.md](references/review-checklist.md) and the
  report contract in
  [references/output-contracts.md](references/output-contracts.md).

Use `assess` for requests to review, report, or evaluate without authorization
to edit. Use `loop` when the user asks to improve or fix the repository.

## Preserve boundaries

- Read and follow `AGENTS.md` before acting. Preserve unrelated work.
- Keep CPU, PPU, SMP/APU, cartridge, timing, and serialization behavior in
  C/C++; do not reimplement emulation logic in TypeScript.
- Prefer frontend adapters over changes to `bsnes/sfc/`. Treat changes to core
  timing, scheduling, serialization, and compatibility as high-judgment work.
- Keep emulation in the dedicated worker. Keep the browser ABI small,
  C-compatible, and synchronized with the typed worker protocol.
- Do not commit ROMs, firmware, keys, saves, generated Wasm, `node_modules`, or
  `.next`. Use only licensed homebrew/public-domain fixtures and record their
  provenance.
- Keep ROM and save data local unless the user explicitly authorizes and
  documents a different data flow.
- Do not claim browser gameplay, audio, persistence, or compatibility from a
  build alone. Apply the runtime acceptance criteria in `docs/web-port.md`.
- Do not commit, push, publish, deploy, or probe external systems unless the
  user explicitly authorizes the action.
- In assess mode, do not edit source, dependencies, backlog, or documentation.
  Separate verified defects, evidence-backed risks, inferences, and open
  questions.

## Run loop mode

### 1. Orient

- Read `AGENTS.md`, `README.md`, `docs/web-port.md`, and
  `docs/improvement-backlog.md`.
- Inspect `git status` and identify pre-existing changes.
- Run the narrow baseline for the selected area. For the browser shell, use
  `npm run check` and `npm audit` from `web/`. Check for `em++` and GNU Make
  before attempting `npm run core:build`.

### 2. Scan one focus area

Choose the user-named area or the least recently reviewed area:

- **emulation correctness** — core/frontend boundaries, frame behavior,
  scheduler changes, state synchronization, and native compatibility;
- **web runtime** — worker ownership, ABI/protocol agreement, frame pacing,
  input, audio buffering, persistence, and recoverable errors;
- **build and portability** — Emscripten/Make integration, native target
  isolation, generated artifacts, browser headers, and reproducibility;
- **security and privacy** — hostile ROM/state inputs, memory and resource
  bounds, local-data guarantees, dependencies, headers, and data egress;
- **tests and compatibility** — legal fixtures, negative paths, state
  round-trips, PAL/NTSC, browsers, enhancement chips, and long-run stability;
- **performance** — Wasm size and startup, memory high-water mark, Asyncify
  overhead, frame/audio timing, copies, and main-thread responsiveness;
- **accessibility and UX** — keyboard-only operation, labels, focus, errors,
  controller mapping, responsive layout, and mobile controls;
- **documentation alignment** — README, `AGENTS.md`, `docs/web-port.md`,
  commands, current milestone, and implementation claims.

Record real findings with evidence, priority, rationale, and an observable
completion condition. Do not manufacture findings to fill every category.

### 3. Fix

- Address actionable High items first, then the highest-value Medium items that
  fit one reviewable change.
- Add focused regression coverage for behavior changes when an existing test
  seam exists. Do not distort production architecture merely to obtain a
  coverage number.
- Update both sides of ABI or worker-protocol changes.
- Avoid broad formatting or unrelated upstream cleanup.

### 4. Verify

- Run the narrowest relevant check first, then the applicable commands in
  `AGENTS.md`.
- For browser shell changes, run `npm run check` and `npm audit`.
- When the toolchain exists and the core/build boundary changed, clean the
  shared object directory as required and run `npm run core:build`.
- For runtime changes, validate with a legal ROM against the acceptance
  criteria in `docs/web-port.md`; state exactly what could not be tested.
- Recheck `git status` and inspect the final diff.

### 5. Record

- Update `docs/improvement-backlog.md`: close completed items with the date and
  validation evidence, and add material unresolved findings.
- Update `README.md`, `docs/web-port.md`, and `AGENTS.md` when status,
  architecture, prerequisites, blockers, or validation commands changed.
- Add plain-language release notes only when the session produced a
  user-visible or maintainer-relevant change, following
  [`release-notes-on-session-end`](../release-notes-on-session-end/SKILL.md).

## Run assess mode

1. Read repository instructions, status documents, backlog, and relevant
   manifests; inspect the working tree.
2. Map source, tests, documentation, architecture, configuration, generated
   artifacts, and validation surfaces.
3. Apply each relevant lens in
   [references/review-checklist.md](references/review-checklist.md) at triage
   depth. Cite repository-relative evidence and mark limitations.
4. Prioritize proposed outcomes using
   [references/output-contracts.md](references/output-contracts.md). Do not
   edit the backlog in assess mode.
5. Report scope and limitations, strengths, verified weaknesses and risks,
   documentation and test evidence, highest-value next improvements, changes
   made, and validation performed. Do not invent numeric coverage or readiness.

## Completion criteria

- Loop mode leaves a verified, reviewable change and an accurate backlog, or
  clearly reports the blocker and evidence gathered.
- Assess mode leaves the working tree unchanged and reports strengths alongside
  risks.
- Every runtime or milestone claim matches current evidence.

## Resources

- [references/review-checklist.md](references/review-checklist.md)
- [references/output-contracts.md](references/output-contracts.md)
- [agents/claude-code.md](agents/claude-code.md)
- [agents/openai.yaml](agents/openai.yaml)
