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
outputs are not committed.

## Build the core

Activate a current Emscripten SDK and make sure `em++` and GNU Make are on
`PATH`, then run:

```sh
npm run core:build
npm run dev
```

The command compiles `bsnes/target-web` and writes `bsnes-core.mjs` plus
`bsnes-core.wasm` to `public/emulator/`. Run `make -C ../bsnes clean` before
switching between native, Libretro, and web targets because the upstream build
system shares its object directory.

## Validate

```sh
npm run check
```

The browser shell can be linted, type-checked, and production-built without the
generated WebAssembly module. Core validation additionally requires Emscripten
and a legally obtained test ROM.
