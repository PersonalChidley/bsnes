# bsnes web shell

This is the browser application shell for the experimental bsnes WebAssembly
port. It uses the Next.js App Router and keeps emulation off the browser's main
thread.

## Run the shell

```sh
npm install
npm run dev
```

Without generated core artifacts, the UI starts normally and reports that the
WebAssembly core is unavailable. This is intentional: ROMs and generated build
outputs must not be committed.

## Local ROM library

In development, the shell scans `roms/snes` and lists `.sfc` and `.smc`
files in the cartridge panel. Selecting a game downloads it only from the local
Next.js process to the browser, then transfers its bytes to the existing
emulator worker. ROMs are not copied into `public/`.

To use a different directory, set `BSNES_ROM_LIBRARY_DIR` before starting the
app:

```powershell
$env:BSNES_ROM_LIBRARY_DIR = "D:\Games\SNES"
npm run dev
```

The automatic `roms/snes` default is development-only. A production server
must opt in with `BSNES_ROM_LIBRARY_DIR`. Do not expose an opted-in server to
untrusted clients because its ROM routes serve files from that directory.

## Audio playback

Pressing Play creates or resumes an `AudioContext`, then connects the emulator
worker to an `AudioWorklet` through a SharedArrayBuffer stereo PCM ring. The
worklet converts the core sample rate to the browser device rate and applies
bounded drift correction around a 60 ms target buffer. The cartridge panel
shows current buffer depth, correction, and underrun/overrun counts.

Audio requires the app's COOP/COEP headers and therefore must be tested through
`npm run dev` or `npm start`, not by opening generated files directly. Pause,
reset, ROM changes, and state loads flush buffered samples.

## Game controllers

The shell polls the browser Gamepad API once per animation frame and assigns the
first two detected controllers to P1 and P2. USB and Bluetooth controllers use
the same browser interface. Most browsers reveal a newly connected controller
only after a button is pressed while the page is focused.

The standard layout maps as follows:

| Browser control | SNES control |
| --- | --- |
| Bottom / right / left / top face buttons | B / A / Y / X |
| Left / right shoulder | L / R |
| Back / start | Select / Start |
| D-pad or left analog stick | D-pad |

Non-standard controllers use the same button indices as a best-effort fallback.
Controller remapping is not implemented yet. Keyboard and controller state is
combined, and focus loss or disconnection releases that input source to avoid
stuck buttons.

## Build the core

Activate a current Emscripten SDK and make sure `em++` and GNU Make are on
`PATH`, then run:

```sh
npm run core:build
npm run dev
```

On Windows, the build script also supports a WSL fallback. If native tools are
not found, it uses GNU Make from the default WSL distribution and discovers an
activated emsdk checkout beside the repository. Set `BSNES_WSL_DISTRO`,
`BSNES_WSL_EMSDK`, or `BSNES_WSL_NODE_BIN` to override those locations.

The command compiles `bsnes/target-web` and writes `bsnes-core.mjs` plus
`bsnes-core.wasm` to `public/emulator/`. Run `make -C bsnes clean` before
switching between native, Libretro, and web targets because the upstream build
system shares its object directory.

## Deploy to Vercel

The application manifest and Next.js configuration are at the repository root,
so no Vercel Root Directory override is needed. The checked-in `vercel.json`
runs `npm run vercel:build`. On a clean deployment this command downloads and
activates the pinned Emscripten 6.0.5 SDK under the ignored `.cache/` directory,
builds the core into `public/emulator/`, and runs the Next.js production build.

The Vercel build image provides Git and GNU Make; Python 3 is also required by
the Emscripten SDK bootstrap. Generated core files remain ignored and are
created only inside the deployment build. Production leaves the filesystem ROM
library disabled, so users load ROMs with the browser file picker. The
missing-core Linux bootstrap has been exercised locally through WSL, but the
first connected Vercel deployment remains a required validation.

## Validate

```sh
npm run check
```

The browser shell can be linted, type-checked, and production-built without the
generated WebAssembly module. Core validation additionally requires Emscripten
and a legally obtained test ROM.
