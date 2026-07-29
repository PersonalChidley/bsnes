# Improvement backlog

This backlog records evidence-backed maintenance and browser-port improvements.
`AGENTS.md` defines repository policy, while `docs/web-port.md` owns the
browser-port architecture, status, milestones, and runtime acceptance criteria.

## High

- **WEB-001 — Produce and validate the first browser frame**
  - Evidence: the generated Emscripten module is absent and the C++ web target
    has not completed its first compile or legal-ROM runtime test.
  - Rationale: this blocks every claim that the browser emulator is playable.
  - Effort: L until the first compiler and runtime failures are known.
  - Dependencies: Emscripten SDK, GNU Make, and a licensed
    homebrew/public-domain test ROM.
  - Acceptance: `npm run core:build` succeeds; a legal test ROM loads and
    produces correct, stable frames; results and limitations are documented.

## Medium

- **WEB-002 — Implement measured browser audio playback**
  - Evidence: PCM reaches the worker boundary, but no AudioWorklet/ring-buffer
    playback or drift measurement exists.
  - Rationale: gameplay is not release-ready without stable audible output.
  - Effort: L.
  - Dependencies: WEB-001.
  - Acceptance: playback handles pause/resume and sample-rate changes with
    measured underrun, overrun, and drift behavior.

- **WEB-003 — Persist SRAM and validate state round-trips**
  - Evidence: SRAM remains in MEMFS and state operations have not been runtime
    tested.
  - Rationale: users can otherwise lose progress, and state correctness is
    unproven.
  - Effort: L.
  - Dependencies: WEB-001.
  - Acceptance: explicit IndexedDB synchronization handles reload and failure;
    save-state round-trips restore an identical observable state.

## Low

No items recorded.

## Future ideas

- Gamepad remapping and mobile controls.
- Broader PAL/NTSC, enhancement-chip, browser, and long-run compatibility
  coverage.

## Done

Record completed items here with the completion date, focus area, and validation
evidence.
