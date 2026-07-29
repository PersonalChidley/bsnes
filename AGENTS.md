# Repository instructions for AI contributors

## Mission

This fork has two responsibilities:

1. Preserve bsnes as a high-accuracy native Super Nintendo emulator.
2. Build an incremental browser port that compiles the existing C++ core to
   WebAssembly and hosts it in a Next.js application.

Do not rewrite emulation logic in TypeScript. The browser application is a
frontend; CPU, PPU, SMP/APU, cartridge, timing, and serialization behavior stay
in C/C++.

Read `README.md` and `docs/web-port.md` before changing the web port. Update this
file and `docs/web-port.md` when an architectural decision, build prerequisite,
known blocker, or validation command changes. These files are the handoff
contract for future AI sessions.

## Repository map

- `bsnes/sfc/` — Super Famicom emulation core.
- `bsnes/emulator/` — frontend-independent `Emulator::Interface` and
  `Emulator::Platform` contracts.
- `bsnes/processor/` — CPU and coprocessor implementations.
- `bsnes/target-bsnes/` — native desktop application.
- `bsnes/target-libretro/` — frame-oriented Libretro adapter reused by the web
  target.
- `bsnes/target-web/` — browser C ABI and Emscripten link target.
- `libco/` — cooperative threading used by the emulation scheduler; the
  Emscripten backend uses fibers plus Asyncify.
- `hiro/` and `ruby/` — native UI and audio/video/input drivers. They are not
  part of the browser build.
- `web/` — Next.js App Router shell, worker protocol, canvas UI, and generated
  core destination. Its read-only local ROM routes scan `roms/snes/` during
  development or `BSNES_ROM_LIBRARY_DIR` when explicitly configured.
- `docs/` — native documentation and the browser-port engineering record.

## Browser architecture

```text
Next.js UI (browser main thread)
  -> read-only local ROM library route
  -> keyboard and two-player Gamepad API input
  -> typed postMessage protocol
Dedicated Web Worker
  |-> generated Emscripten ES module
  |     -> bsnes/target-web C ABI
  |     -> existing target-libretro adapter
  |     -> Emulator::Platform / SuperFamicom::Interface
  |     -> bsnes C++ core
  `-> SharedArrayBuffer stereo PCM ring
        -> AudioWorklet
        -> browser audio device
```

The worker owns the Wasm instance. Never run emulation frames on the browser
main thread. Never transfer the Wasm memory buffer; copy video/audio/state data
into transferable buffers because detaching Wasm memory breaks the module.
Audio is the exception to per-frame copying: the worker copies core PCM into a
dedicated SharedArrayBuffer ring, and the AudioWorklet reads that ring.
Gamepad polling stays on the main thread and sends only aggregate SNES button
state changes to the worker. Keep input separated by source so keyboard and
controller releases cannot cancel each other; clear the affected source on
focus loss or controller disconnect.

The public ABI is declared in `bsnes/target-web/bridge.hpp`. Keep it small,
C-compatible, versionable, and independent of React or browser DOM types.
Message names and payloads are defined in
`web/src/lib/emulator/protocol.ts`. When either boundary changes, update both
sides and `docs/web-port.md`.

The local ROM library accepts only regular `.sfc` and `.smc` files and must
never copy them into `web/public/`. Its `roms/snes/` default is
development-only; production use requires `BSNES_ROM_LIBRARY_DIR` and must not
expose the opted-in routes to untrusted clients.

## Current milestone

Milestone one is first-frame and runtime validation:

- the Next.js shell loads without generated core files and explains how to
  build them;
- a dedicated worker can load the modularized Emscripten output;
- the C++ target compiles and links with Emscripten 6.0.5;
- the C ABI covers ROM load, one-frame execution, XRGB8888 video, stereo audio,
  two joypads, reset, and save states;
- a Chrome smoke test with a user-provided ROM produced a non-black 256×224
  frame and exercised play, pause, reset, and keyboard input;
- an AudioWorklet consumes a SharedArrayBuffer PCM ring with sample-rate
  conversion, bounded drift correction, and underrun/overrun metrics;
- up to two browser gamepads are assigned to P1/P2 with standard-layout mapping
  and analog directional fallback;
- the native frontend remains unchanged.

Do not generalize the short Chrome smoke test into broad compatibility. A
documented public-domain reference ROM, state round-trip, sustained audible
playback across real devices, physical controller validation, SRAM persistence,
long-run stability, and additional browsers remain unvalidated.

## Build and validation commands

### Browser shell

Run from `web/`:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
npm audit
```

`npm run check` runs lint, type-checking, and the production build.

### WebAssembly core

Activate emsdk first so `em++` is available, and install GNU Make. On Windows,
`scripts/build-core.mjs` can instead use GNU Make in the default WSL
distribution plus an activated emsdk checkout beside the repository (for
example, `C:\DEV\emsdk` beside `C:\DEV\bsnes`). `BSNES_WSL_DISTRO`,
`BSNES_WSL_EMSDK`, and `BSNES_WSL_NODE_BIN` override fallback discovery. Then
run from `web/`:

```sh
npm run core:build
npm run dev
```

The generated `bsnes-core.mjs` and `bsnes-core.wasm` belong in
`web/public/emulator/` and must not be committed.

The upstream makefiles share `bsnes/obj/` between targets. Run
`make -C bsnes clean` before switching between native, Libretro, and web builds,
especially after changing flags.

### Native application

Use the platform-specific prerequisites in
`docs/how-to/build-from-source.md`, then:

```sh
make -C bsnes local=false
```

For focused changes, run the narrowest relevant validation first, followed by
the complete applicable command set before handoff.

## Repository skills

The canonical repository-owned AI workflows live under `skills/`. They are
procedural guidance and always defer to this file. Invoke them by path when the
assistant does not automatically discover project-local skills, for example:

```text
Read and follow skills/improve/SKILL.md in loop mode.
Read and follow skills/security-review/SKILL.md in review mode.
```

Available workflows cover improvement coordination, security, performance,
test coverage, documentation synchronization, and session-end release notes.
Keep assistant-specific discovery files as thin pointers to the canonical
`skills/<name>/SKILL.md`; do not duplicate workflow bodies.

## Engineering rules

- Preserve upstream behavior. Prefer new frontend adapters over edits to
  `bsnes/sfc/`.
- Reuse `target-libretro` while it remains the smallest stable frame-oriented
  seam. If web-specific needs force divergence, extract shared adapter code
  instead of copying large implementations.
- Keep the first web core single-threaded. `openmp=false` is intentional.
  Browser pthreads and HD Mode 7 parallelism require profiling plus
  cross-origin-isolation validation before adoption.
- The libco Emscripten backend is non-serializable. Save states therefore use
  synchronized core serialization. Do not enable raw fiber-stack
  serialization.
- Browser audio must stay on the AudioWorklet/SharedArrayBuffer ring-buffer
  path. Pause, reset, state load, and ROM switching must flush stale samples.
  Keep underrun, overrun, buffer-depth, and drift-correction metrics visible;
  synthetic rendering alone is not proof of sustained audible playback.
- Browser persistence must use explicit Emscripten FS/IndexedDB synchronization
  with error handling. Never imply SRAM is durable until reload tests pass.
- Keep ROM bytes local. Do not add upload endpoints or telemetry containing ROM
  names, hashes, bytes, save RAM, or save states without explicit user approval
  and documentation.
- Never add copyrighted ROMs, console firmware, keys, save files, generated
  Wasm outputs, `node_modules/`, or `.next/`.
- Use only homebrew/public-domain test ROMs in automated tests, and document
  their provenance and license.
- Maintain GPLv3 notices and attribution. New linked emulator code must be
  GPL-compatible.

## Code style

- Existing C++ generally uses C++17, two-space indentation, and trailing return
  types (`auto function() -> Type`). Match the surrounding file when it differs.
- Keep the web bridge C ABI explicit (`uint32_t`, `size_t`, plain pointers,
  integer status codes). Do not expose C++ containers or exceptions across it.
- Web code uses strict TypeScript, App Router, function components, and no
  implicit `any`. Keep emulation orchestration in the worker/client layer rather
  than React components.
- Treat generated Emscripten files as build outputs. Do not hand-edit them.
- Avoid broad formatting passes over upstream code.

## Change checklist

Before finishing a web-port change:

1. Check `git status` and keep unrelated user changes untouched.
2. Update both sides of any worker or C ABI change.
3. Run `npm run check` and `npm audit` in `web/`.
4. If Emscripten is available, run `npm run core:build`.
5. For runtime changes, test ROM load, frame output, pause/resume, reset, input,
   and state round-trip with a legal test ROM.
6. Update `README.md`, `docs/web-port.md`, and this file when status or workflow
   changes.
7. State clearly which checks ran and which could not run.
