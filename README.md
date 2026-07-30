# bsnes

![bsnes logo](bsnes/target-bsnes/resource/logo.png)

bsnes is a multi-platform Super Nintendo (Super Famicom) emulator originally
developed by Near, with a focus on accuracy, performance, features, and ease of
use.

This fork is beginning an experimental browser port. The emulation core remains
in C/C++ and is compiled to WebAssembly; Next.js provides the application shell,
canvas, file picker, input, and eventually browser persistence.

## Project status

The native application and Libretro core remain the mature upstream products.
The web port is in **first-frame validation**:

- a Next.js shell and dedicated emulator worker are implemented;
- a small browser-facing C ABI wraps the existing Libretro adapter;
- an Emscripten fiber backend has been added for bsnes' cooperative scheduler;
- the C++ WebAssembly target compiles with Emscripten 6.0.5;
- a Chrome runtime smoke test loaded a user-provided ROM, rendered a 256×224
  frame, and exercised play, pause, reset, and keyboard input;
- browser audio uses an AudioWorklet plus a SharedArrayBuffer PCM ring with
  live buffer, drift, and underrun/overrun metrics;
- the browser polls up to two USB or Bluetooth game controllers through the
  Gamepad API, with standard-layout mapping and analog directional fallback;
- the shell passes lint, strict TypeScript checking, a production build, and a
  clean npm audit.

Sustained audible playback across real devices, durable SRAM, long-run
stability, physical controller compatibility, save-state round trips, and a
documented public-domain reference ROM remain to be validated.

See [the web-port engineering record](docs/web-port.md) for the detailed review,
architecture, known risks, and milestones. AI contributors should also read
[AGENTS.md](AGENTS.md).

## Architecture

```text
Next.js UI
  -> Dedicated Web Worker
    -> Emscripten module
      -> target-web C ABI
        -> existing target-libretro adapter
          -> Emulator::Platform
            -> bsnes C++ core
```

This preserves the existing CPU, PPU, SMP/APU, cartridge, timing, and
serialization implementations. The desktop frontend (`target-bsnes`, `hiro`,
and `ruby`) is not linked into the browser build.

## Run the web shell

Requirements:

- Node.js 20.9 or newer;
- npm.

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. Until the generated core exists, the shell will
load normally and report the missing WebAssembly artifact.

To build the core, activate a current Emscripten SDK and install GNU Make, then
run:

```sh
npm run core:build
npm run dev
```

Generated `bsnes-core.mjs` and `bsnes-core.wasm` files are intentionally ignored.
ROMs and console firmware must not be committed.

During local development, `.sfc` and `.smc` files stored in `roms/snes/` appear
in the web cartridge panel. The directory is ignored by Git and its files are
served only through the local Next.js process. See
[`docs/web-app.md`](docs/web-app.md#local-rom-library) for configuration and
deployment precautions.

Validate the browser shell with:

```sh
npm run check
npm audit
```

## Deploy to Vercel

The Next.js application now lives at the repository root, so Vercel detects it
without a Root Directory override. `vercel.json` runs `npm run vercel:build`,
which installs the pinned Emscripten 6.0.5 SDK when needed, builds the ignored
WebAssembly artifacts, and then builds Next.js. Connect the repository as a
standard Next.js project and deploy from the root.

Production does not expose `roms/snes/`. Players choose a local ROM file in the
browser; ROM bytes remain in that browser session. The clean Linux bootstrap
path has been exercised locally through WSL; the first remote Vercel deployment
still needs validation in the connected project.

## Build the native application

Follow [Build From Source](docs/how-to/build-from-source.md) for platform
prerequisites, then run:

```sh
make -C bsnes
```

Additional native build options are documented in
[Build Configuration](docs/reference/build-config.md).

## Repository guide

- `bsnes/sfc/` — Super Famicom emulation core.
- `bsnes/emulator/` — frontend-independent emulator interfaces.
- `bsnes/target-bsnes/` — native desktop frontend.
- `bsnes/target-libretro/` — Libretro frontend.
- `bsnes/target-web/` — experimental WebAssembly bridge and build target.
- `libco/` — cooperative threading backends.
- `hiro/` and `ruby/` — native UI and platform drivers.
- `src/`, `public/`, and `scripts/` — root-level Next.js browser shell, worker,
  AudioWorklet, and browser build tooling.
- `docs/` — build, user, and porting documentation.

## Highlights

- True Super Game Boy emulation using SameBoy
- HD Mode 7 graphics with optional supersampling
- Low-level emulation of SNES coprocessors
- Multi-threaded fast PPU renderer on supported native builds
- Built-in game and cheat databases
- Save states, rewind, run-ahead, movies, screenshots, and soft patches
- MSU1, Satellaview, BS Memory, and Sufami Turbo support
- OpenGL shaders and multiple software filters
- Adaptive synchronization, dynamic rate control, and low-latency input
- Native Windows, macOS, Linux, and FreeBSD frontends

The complete feature set currently applies to native bsnes. Browser support will
be enabled incrementally as each subsystem is compiled, tested, and documented.

## Browser roadmap

1. Compile the core and render the first correct frame.
2. Validate continuous timing and keyboard/gamepad input on physical devices.
3. Validate AudioWorklet playback, buffering, and drift across real devices.
4. Persist SRAM/RTC data and expose save-state import/export.
5. Test enhancement chips, PAL/NTSC, multiple browsers, and long-run stability.
6. Add settings, remapping, accessibility, mobile controls, and deployment.

## Legal and licensing

Use only ROM images and firmware you are legally entitled to use. ROMs, firmware,
save files, and generated WebAssembly artifacts must not be committed.

bsnes is licensed under GPLv3; see [GPLv3.txt](GPLv3.txt) and
[LICENSE.txt](LICENSE.txt). Credits are in [CREDITS.md](CREDITS.md).

## Upstream

- [Official bsnes repository](https://github.com/bsnes-emu/bsnes)
- [Official Discord](https://discord.gg/B27hf27ZVf)

## Native preview

![bsnes user interface](.assets/user-interface.png)
![bsnes running Bahamut Lagoon](.assets/bahamut-lagoon.png)
![bsnes running Tengai Makyou Zero](.assets/tengai-makyou-zero.png)
