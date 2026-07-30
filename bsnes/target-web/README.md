# bsnes WebAssembly target

This target adapts the existing Libretro frontend to a small browser-facing C
API. It is intentionally limited to the first web-port milestone:

- load an in-memory `.sfc`/`.smc` ROM through Emscripten's MEMFS;
- run exactly one emulated frame per call;
- expose XRGB8888 video, stereo PCM audio, and two joypads;
- configure the existing software filters, overscan, and hires blur;
- reset and serialize/unserialize emulator state.

The target does not include a ROM, firmware, generated JavaScript, or a
generated WebAssembly binary. Those artifacts are built into
`public/emulator/` by `npm run core:build` from the repository root.

The current build uses Emscripten fibers and Asyncify to implement bsnes'
cooperative core threads. OpenMP and browser pthreads are deliberately disabled
for the first milestone. The target first compiled and linked with Emscripten
6.0.5; a short Chrome smoke test loaded a ROM and produced a non-black 256×224
frame. See `docs/web-port.md` for the architecture, remaining validation risks,
and next steps.
