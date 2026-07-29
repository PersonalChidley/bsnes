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
   The initial compile and short Chrome runtime smoke test pass; fiber stack
   sizing and long-run stability still need validation.
2. Audio is generated synchronously with emulation but played asynchronously.
   The worker now writes PCM into a SharedArrayBuffer ring consumed by an
   AudioWorklet. Short synthetic rendering passes; sustained audible playback,
   long-run underruns, and device-specific drift remain validation risks.
3. Libretro ROM and SRAM handling is path-based. The web bridge writes a
   selected ROM into MEMFS. SRAM currently remains an in-memory Emscripten file
   until an explicit IndexedDB persistence layer is added.
4. Super Game Boy support requires firmware and adds SameBoy behavior. The
   initial UI accepts only `.sfc` and `.smc`; SGB, BS-X, Sufami Turbo, MSU1,
   archive loading, and enhancement-chip firmware need separate test plans.
5. The Emscripten 6.0.5 output is approximately 4.39 MiB of Wasm plus 201 KiB
   of JavaScript before transport compression. The link uses a 256 MiB initial
   memory with growth enabled. Measure runtime high-water usage before tuning
   or imposing a maximum.

## Implemented architecture

```text
web/src/components/EmulatorShell.tsx
  |
  |-> Gamepad API polling (P1/P2)
  |
  | EmulatorCommand / EmulatorEvent
  v
web/public/emulator/emulator.worker.js
  |
  |-> Emscripten module exports
  |     -> bsnes/target-web/bridge.cpp
  |     -> bsnes/target-libretro/libretro.cpp
  |     -> Emulator::Platform
  |     -> bsnes/sfc + bsnes/processor + bsnes/gb
  |
  `-> SharedArrayBuffer Int16 stereo PCM ring
        -> web/public/emulator/audio-worklet.js
        -> Float32 Web Audio output
        -> browser audio device
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

## Local ROM library

The development shell exposes a read-only ROM library through `/api/roms`. It
scans `roms/snes/` by default or `BSNES_ROM_LIBRARY_DIR` when configured,
accepts only regular `.sfc` and `.smc` files up to 64 MiB, and passes selected
bytes into the existing worker protocol. ROMs are never copied to `public/`.
The default directory is enabled only in development; production must opt in
explicitly and must not expose the file-serving routes to untrusted clients.

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
4. copies framebuffer data into a transferable buffer and PCM into the shared
   audio ring once configured;
5. applies keyboard and controller input state without involving React
   rendering.

The current frame timer remains a prototype. AudioWorklet drift correction
protects device playback from small timing differences, but a future scheduler
should make audio-buffer demand the timing authority and have video follow it.

## Audio pipeline

Audio starts only from the Play button so browser autoplay policy sees a user
gesture. The main thread creates the AudioContext, loads
`audio-worklet.js`, allocates a half-second shared Int16 stereo ring, and sends
the ring configuration to the emulator worker. The worker copies each core PCM
batch into that ring without routing per-frame audio through React.

The worklet:

- waits for an 80 ms startup buffer and targets approximately 60 ms afterward;
- linearly converts the core sample rate to the device sample rate;
- adjusts consumption by at most ±5,000 ppm to correct buffer drift;
- publishes buffer depth, correction, underrun, and overrun metrics through
  atomic ring-header counters.

Pause, reset, state load, ROM replacement, worker error, and shutdown invalidate
or flush buffered samples. Transferable PCM events remain only as a
pre-configuration compatibility fallback.

## Input pipeline

Keyboard events and Gamepad API polling run on the browser main thread, while
the worker applies only changed SNES button states through the existing
two-player C ABI. The first two connected gamepads, ordered by browser gamepad
index, are assigned to P1 and P2. Standard face buttons, shoulders, start,
select, and D-pad positions map to their SNES equivalents; axes 0 and 1 provide
a directional fallback with a 0.5 deadzone.

Input is aggregated by source before crossing the worker boundary. This keeps a
keyboard key held when a controller releases the same P1 button. Controller
disconnect, focus loss, and document hiding release their source so inputs do
not remain stuck. ROM load resynchronizes the complete aggregate state because
the C bridge clears its joypad array when replacing a cartridge.

## Build

Prerequisites:

- Node.js 20.9 or newer;
- npm;
- a current Emscripten SDK with `em++` on `PATH`;
- GNU Make.

On Windows, `scripts/build-core.mjs` first uses native `em++` and Make. If they
are unavailable, it can invoke the default WSL distribution and discover an
activated emsdk checkout beside the repository. The fallback can be configured
with `BSNES_WSL_DISTRO`, `BSNES_WSL_EMSDK`, and `BSNES_WSL_NODE_BIN`.

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
- local development ROM library listing and selection;
- COOP/COEP/CORP response headers;
- first successful Emscripten 6.0.5 compile and link;
- Chrome ROM load and non-black 256×224 frame;
- short play, pause, reset, and keyboard-input runtime smoke test;
- two-player Gamepad API polling, standard-layout mapping, analog directional
  fallback, and live P1/P2 assignment display;
- per-source input aggregation and stuck-input cleanup on disconnect or focus
  loss;
- Chrome smoke test of empty, two-player, and disconnect/reassignment
  controller UI states using simulated Gamepad API devices;
- SharedArrayBuffer stereo audio ring and AudioWorklet playback path;
- sample-rate conversion, bounded drift correction, and live xrun metrics;
- Chrome synthetic AudioWorklet render with non-zero output energy;
- lint, strict TypeScript, production Next.js build, and npm audit.

Not yet validated:

- a documented public-domain ROM compared against native or Libretro reference
  output;
- libco fiber stack sizing and long-run stability;
- audible real-ROM playback and sustained underrun/drift measurements across
  physical audio devices and browsers;
- SRAM persistence;
- save-state runtime round-trip;
- physical USB/Bluetooth controller mapping and input behavior;
- mobile controls and multiple browsers.

The original scaffold environment lacked `emcc`/`em++` and GNU Make. This
checkout was subsequently validated with Emscripten 6.0.5 in an adjacent emsdk
checkout and GNU Make 4.4.1 through WSL. `npm run core:build` now detects that
fallback on Windows.

## Milestones

1. **First frame**
   - [x] install/activate emsdk;
   - [x] make the web target compile;
   - [x] render a user-provided ROM in Chrome;
   - load a public-domain test ROM;
   - verify dimensions, colors, region refresh rate, and stable fiber switches.
2. **Continuous input**
   - run for at least 30 minutes;
   - [x] add two-player Gamepad API polling;
   - validate all buttons with physical standard and non-standard controllers;
   - measure input-to-frame latency and background-tab behavior.
3. **Audio**
   - [x] implement a SharedArrayBuffer ring buffer and AudioWorklet;
   - [x] expose buffer, drift, underrun, and overrun metrics;
   - [x] validate non-zero synthetic output through Chrome AudioWorklet;
   - measure underruns, overruns, drift, pause/resume, and sample-rate changes;
   - validate audible real-ROM playback on physical output devices;
   - retain transferable PCM as a pre-configuration fallback.
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
- audible playback has no chronic underruns, overruns, drift, or stale samples
  after pause/reset;
- save state round-trip returns to an identical visual state;
- a 30-minute run does not show unbounded memory growth;
- errors are visible and recoverable without refreshing the page.
