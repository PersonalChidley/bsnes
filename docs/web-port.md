# WebAssembly port engineering record

## Goal

Run the existing bsnes C++ emulator in a browser while using Next.js only for
the application shell. The browser frontend handles file selection, canvas
presentation, keyboard/gamepad input, settings, and persistence. It must not
reimplement console hardware in TypeScript.

## Repository review

The project is a good candidate for an incremental port:

- `bsnes/emulator/` defines a small frontend contract. The core already sends
  video and audio through `Emulator::Platform` and polls input through the same
  abstraction.
- `bsnes/sfc/` implements a frame-returning `Interface::run()`. Browser code
  does not need to interrupt an infinite native application loop.
- `bsnes/target-libretro/` already adapts ROM loading, heuristic manifests,
  input, XRGB8888 video, 48 kHz stereo audio, and synchronized state
  serialization to a C API.
- Native UI and host drivers are isolated in `target-bsnes`, `hiro`, and
  `ruby`. The web target does not link them.
- The build is GNU Make plus C++17. The fast PPU has one OpenMP rendering path;
  `openmp=false` provides a viable single-threaded starting point.

The important porting risks are:

1. bsnes schedules emulated components with `libco`. Native libco backends use
   architecture-specific assembly, Windows fibers, or POSIX signals. The web
   target adds `libco/emscripten.c`, based on Emscripten fibers and Asyncify.
   This needs compile and runtime validation.
2. Audio is generated synchronously with emulation, but browser playback is
   asynchronous. The scaffold transports PCM out of the worker; it does not
   yet schedule it through an AudioWorklet or correct drift.
3. Libretro ROM and SRAM handling is path-based. The web bridge writes a
   selected ROM into MEMFS. SRAM currently remains an in-memory Emscripten file
   until an explicit IndexedDB persistence layer is added.
4. Super Game Boy support requires firmware and adds SameBoy behavior. The
   initial UI accepts only `.sfc` and `.smc`; SGB, BS-X, Sufami Turbo, MSU1,
   archive loading, and enhancement-chip firmware need separate test plans.
5. Emscripten output size and startup memory are expected to be large. The
   first link uses a 256 MiB initial memory with growth enabled. Measure actual
   high-water usage before tuning or imposing a maximum.

## Implemented architecture

```text
web/src/components/EmulatorShell.tsx
  |
  | EmulatorCommand / EmulatorEvent
  v
web/public/emulator/emulator.worker.js
  |
  | Emscripten module exports
  v
bsnes/target-web/bridge.cpp
  |
  | Libretro callbacks and frame API
  v
bsnes/target-libretro/libretro.cpp
  |
  | Emulator::Platform
  v
bsnes/sfc + bsnes/processor + bsnes/gb
```

Why reuse Libretro:

- it is already the project's headless, frame-oriented frontend;
- it produces a browser-friendly 32-bit framebuffer;
- it includes the cartridge heuristics and embedded system resources required
  for ordinary ROM loading;
- it avoids a second implementation of input mapping, audio conversion, and
  state serialization.

The reuse is pragmatic, not permanent. If browser persistence or module size
requires substantial Libretro-specific workarounds, extract a shared headless
adapter used by both `target-libretro` and `target-web`.

## Browser-facing C ABI

`bsnes/target-web/bridge.hpp` is the source of truth. The initial surface
supports:

- initialize/shutdown;
- load/unload a ROM from bytes;
- reset and run one frame;
- query framebuffer pointer, width, height, and pitch;
- query interleaved stereo audio and timing;
- set two-player joypad state;
- save/load synchronized emulator states;
- retrieve a diagnostic error message.

The framebuffer is XRGB8888. On little-endian WebAssembly memory, byte order is
blue, green, red, unused; the worker converts it to RGBA before posting it to
the browser main thread.

## Worker protocol

The typed UI contract lives in `web/src/lib/emulator/protocol.ts`. The generated
Wasm module is owned by `emulator.worker.js`, which:

1. dynamically imports `bsnes-core.mjs`;
2. allocates Wasm memory and copies selected ROM bytes into the C ABI;
3. clocks one emulated frame at the core-reported refresh rate;
4. copies framebuffer and PCM data into transferable buffers;
5. applies input state without involving React rendering.

The current timer is a prototype. Once audio playback exists, the audio buffer
should become the timing authority and video should follow it.

## Build

Prerequisites:

- Node.js 20.9 or newer;
- npm;
- a current Emscripten SDK with `em++` on `PATH`;
- GNU Make (MSYS2 on Windows).

Browser shell:

```sh
cd web
npm ci
npm run check
```

WebAssembly core:

```sh
cd web
npm run core:build
npm run dev
```

The core command invokes:

```sh
make -C ../bsnes \
  target=web binary=library platform=web compiler=em++ \
  build=release openmp=false local=false \
  web.output=../web/public/emulator
```

Generated files under `web/public/emulator/bsnes-core.*` are ignored.

## Status as of 2026-07-29

Completed:

- full repository boundary and build review;
- Emscripten libco backend;
- browser C ABI and Emscripten link target;
- modular Next.js shell;
- worker ownership and typed message protocol;
- canvas rendering path and keyboard mapping;
- ROM picker, play/pause/reset controls, and state protocol;
- COOP/COEP/CORP response headers;
- lint, strict TypeScript, production Next.js build, and npm audit.

Not yet validated:

- compiling/linking the C++ target with Emscripten;
- first ROM load and correct frame;
- libco fiber stack sizing and long-run stability;
- audio playback;
- SRAM persistence;
- save-state runtime round-trip;
- gamepad API, mobile controls, and multiple browsers.

The C++ target could not be compiled in the original scaffold environment
because `emcc`/`em++`, GNU Make, and a native C++ compiler were unavailable.
That is a tooling limitation, not evidence that the target compiles.

## Milestones

1. **First frame**
   - install/activate emsdk;
   - make the web target compile;
   - load a public-domain test ROM;
   - verify dimensions, colors, region refresh rate, and stable fiber switches.
2. **Continuous input**
   - run for at least 30 minutes;
   - add Gamepad API polling;
   - measure input-to-frame latency and background-tab behavior.
3. **Audio**
   - implement a SharedArrayBuffer ring buffer and AudioWorklet;
   - measure underruns, overruns, drift, pause/resume, and sample-rate changes;
   - retain a non-threaded fallback if practical.
4. **Persistence**
   - sync SRAM/RTC files with IndexedDB;
   - key storage by a stable ROM digest;
   - test reload, corruption, quota failure, import, and export;
   - expose save-state download/upload in the UI.
5. **Compatibility and performance**
   - add legal automated ROM fixtures;
   - test enhancement chips and PAL/NTSC;
   - profile core size, memory, fast PPU, Asyncify cost, and browser coverage.
6. **Product polish**
   - settings, controller remapping, accessibility, mobile controls, and
     deployment monitoring;
   - only then evaluate Wasm pthreads/OpenMP and production hosting.

## Runtime acceptance criteria

Do not call a milestone complete based only on compilation. For the first
usable prototype, verify:

- the ROM never leaves the local browser context;
- NTSC and PAL frames report correct refresh timing;
- colors and geometry match a native or Libretro reference capture;
- all 12 joypad inputs work without stuck keys;
- pause/resume and reset do not accelerate or deadlock scheduling;
- save state round-trip returns to an identical visual state;
- a 30-minute run does not show unbounded memory growth;
- errors are visible and recoverable without refreshing the page.
