const RESULT_OK = 0;
const CORE_MODULE_URL = new URL("./bsnes-core.mjs", import.meta.url);
const AUDIO_RING = {
  writeFrame: 0,
  readFrame: 1,
  underruns: 2,
  overruns: 3,
  active: 4,
  epoch: 5,
  correctionPpm: 6,
  producedFrames: 7,
  consumedFrames: 8,
  headerLength: 10,
  channels: 2,
};
const AUDIO_RING_HEADER_BYTES =
  AUDIO_RING.headerLength * Int32Array.BYTES_PER_ELEMENT;

let core = null;
let initialized = false;
let gameLoaded = false;
let running = false;
let timer = null;
let frameDuration = 1000 / 60;
let nextFrameAt = 0;
let audioRing = null;

const post = (event, transfer = []) => self.postMessage(event, transfer);

const errorMessage = (fallback) => {
  if (!core) return fallback;
  const pointer = core._bsnes_web_last_error();
  return pointer ? core.UTF8ToString(pointer) : fallback;
};

const requireCore = () => {
  if (!core || !initialized) {
    throw new Error("The WebAssembly core is not initialized.");
  }
};

const loadCore = async () => {
  if (initialized) return;
  post({ type: "status", status: "loading" });

  try {
    const { default: createBsnesCore } = await import(CORE_MODULE_URL.href);
    core = await createBsnesCore({
      locateFile: (file) => new URL(file, CORE_MODULE_URL).href,
      printErr: (message) => console.error(`[bsnes] ${message}`),
    });

    const result = core._bsnes_web_init();
    if (result !== RESULT_OK) {
      throw new Error(errorMessage("The bsnes core failed to initialize."));
    }

    initialized = true;
    post({ type: "status", status: "ready" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `WebAssembly core unavailable. Run \`npm run core:build\` in web/. ${detail}`,
    );
  }
};

const loadRom = async (name, bytes) => {
  await loadCore();
  pause();

  const rom = new Uint8Array(bytes);
  const pointer = core._malloc(rom.byteLength);
  if (!pointer) throw new Error("The WebAssembly module could not allocate ROM memory.");

  try {
    core.HEAPU8.set(rom, pointer);
    const result = core._bsnes_web_load_rom(pointer, rom.byteLength);
    if (result !== RESULT_OK) {
      throw new Error(errorMessage("The core could not load this ROM."));
    }
  } finally {
    core._free(pointer);
  }

  gameLoaded = true;
  const fps = core._bsnes_web_frames_per_second();
  const audioSampleRate = core._bsnes_web_audio_sample_rate();
  frameDuration = 1000 / (fps || 60);
  post({ type: "romLoaded", name, fps, audioSampleRate });
  runFrame();
};

const copyVideoFrame = () => {
  const pointer = core._bsnes_web_frame_buffer();
  const width = core._bsnes_web_frame_width();
  const height = core._bsnes_web_frame_height();
  const pitch = core._bsnes_web_frame_pitch();
  if (!pointer || !width || !height || pitch < width * 4) return;

  const source = core.HEAPU8;
  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    let sourceOffset = pointer + y * pitch;
    let targetOffset = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      pixels[targetOffset] = source[sourceOffset + 2];
      pixels[targetOffset + 1] = source[sourceOffset + 1];
      pixels[targetOffset + 2] = source[sourceOffset];
      pixels[targetOffset + 3] = 255;
      sourceOffset += 4;
      targetOffset += 4;
    }
  }

  post(
    { type: "frame", width, height, pixels: pixels.buffer },
    [pixels.buffer],
  );
};

const configureAudio = (buffer, capacityFrames) => {
  if (!(buffer instanceof SharedArrayBuffer)) {
    throw new Error("Audio configuration requires shared memory.");
  }
  if (!Number.isInteger(capacityFrames) || capacityFrames < 2) {
    throw new Error("Audio configuration has an invalid capacity.");
  }

  const expectedBytes =
    AUDIO_RING_HEADER_BYTES +
    capacityFrames *
      AUDIO_RING.channels *
      Int16Array.BYTES_PER_ELEMENT;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error("Audio configuration has an invalid buffer size.");
  }

  const header = new Int32Array(
    buffer,
    0,
    AUDIO_RING.headerLength,
  );
  audioRing = {
    capacityFrames,
    header,
    samples: new Int16Array(
      buffer,
      AUDIO_RING_HEADER_BYTES,
      capacityFrames * AUDIO_RING.channels,
    ),
  };
};

const flushAudioRing = (deactivate = false) => {
  if (!audioRing) return;
  if (deactivate) {
    Atomics.store(audioRing.header, AUDIO_RING.active, 0);
  }
  const writeFrame = Atomics.load(
    audioRing.header,
    AUDIO_RING.writeFrame,
  );
  Atomics.store(audioRing.header, AUDIO_RING.readFrame, writeFrame);
  Atomics.add(audioRing.header, AUDIO_RING.epoch, 1);
  Atomics.store(audioRing.header, AUDIO_RING.correctionPpm, 0);
};

const writeAudioRing = (pointer, frames) => {
  if (
    !audioRing ||
    Atomics.load(audioRing.header, AUDIO_RING.active) === 0
  ) {
    return;
  }

  const writeFrame = Atomics.load(
    audioRing.header,
    AUDIO_RING.writeFrame,
  ) >>> 0;
  const readFrame = Atomics.load(
    audioRing.header,
    AUDIO_RING.readFrame,
  ) >>> 0;
  const availableFrames = Math.min(
    (writeFrame - readFrame) >>> 0,
    audioRing.capacityFrames,
  );
  const framesToWrite = Math.min(
    frames,
    audioRing.capacityFrames - availableFrames,
  );
  const source = core.HEAP16;
  const sourceStart = pointer >> 1;

  for (let frame = 0; frame < framesToWrite; frame += 1) {
    const target =
      ((writeFrame + frame) % audioRing.capacityFrames) *
      AUDIO_RING.channels;
    const sourceOffset = sourceStart + frame * AUDIO_RING.channels;
    audioRing.samples[target] = source[sourceOffset];
    audioRing.samples[target + 1] = source[sourceOffset + 1];
  }

  if (framesToWrite > 0) {
    Atomics.store(
      audioRing.header,
      AUDIO_RING.writeFrame,
      (writeFrame + framesToWrite) | 0,
    );
    Atomics.add(
      audioRing.header,
      AUDIO_RING.producedFrames,
      framesToWrite,
    );
  }
  if (framesToWrite < frames) {
    Atomics.add(audioRing.header, AUDIO_RING.overruns, 1);
  }
};

const publishAudioFrame = () => {
  const pointer = core._bsnes_web_audio_buffer();
  const frames = core._bsnes_web_audio_frames();
  if (!pointer || !frames) return;

  if (audioRing) {
    writeAudioRing(pointer, frames);
    return;
  }

  const samples = new Int16Array(frames * 2);
  samples.set(core.HEAP16.subarray(pointer >> 1, (pointer >> 1) + frames * 2));
  post(
    {
      type: "audio",
      sampleRate: core._bsnes_web_audio_sample_rate(),
      samples: samples.buffer,
    },
    [samples.buffer],
  );
};

const runFrame = () => {
  requireCore();
  if (!gameLoaded) return;

  const result = core._bsnes_web_run_frame();
  if (result !== RESULT_OK) {
    throw new Error(errorMessage("The core failed while running a frame."));
  }
  copyVideoFrame();
  publishAudioFrame();
};

const scheduleNextFrame = () => {
  if (!running) return;
  const delay = Math.max(0, nextFrameAt - performance.now());
  timer = setTimeout(tick, delay);
};

const tick = () => {
  if (!running) return;
  try {
    runFrame();
    nextFrameAt += frameDuration;
    if (nextFrameAt < performance.now() - frameDuration) {
      nextFrameAt = performance.now() + frameDuration;
    }
    scheduleNextFrame();
  } catch (error) {
    pause();
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

const start = () => {
  requireCore();
  if (!gameLoaded || running) return;
  running = true;
  nextFrameAt = performance.now();
  post({ type: "status", status: "running" });
  scheduleNextFrame();
};

const pause = () => {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  running = false;
  flushAudioRing(true);
  if (initialized) post({ type: "status", status: "paused" });
};

const saveState = () => {
  requireCore();
  const size = core._bsnes_web_state_size();
  if (!size) throw new Error("No save state is available.");

  const pointer = core._malloc(size);
  if (!pointer) throw new Error("The WebAssembly module could not allocate state memory.");
  try {
    const result = core._bsnes_web_save_state(pointer, size);
    if (result !== RESULT_OK) {
      throw new Error(errorMessage("The core could not save state."));
    }
    const state = new Uint8Array(size);
    state.set(core.HEAPU8.subarray(pointer, pointer + size));
    post({ type: "state", bytes: state.buffer }, [state.buffer]);
  } finally {
    core._free(pointer);
  }
};

const loadState = (bytes) => {
  requireCore();
  const state = new Uint8Array(bytes);
  const pointer = core._malloc(state.byteLength);
  if (!pointer) throw new Error("The WebAssembly module could not allocate state memory.");
  try {
    core.HEAPU8.set(state, pointer);
    const result = core._bsnes_web_load_state(pointer, state.byteLength);
    if (result !== RESULT_OK) {
      throw new Error(errorMessage("The core could not load state."));
    }
    runFrame();
  } finally {
    core._free(pointer);
  }
};

self.addEventListener("message", async ({ data }) => {
  try {
    switch (data.type) {
      case "init":
        await loadCore();
        break;
      case "loadRom":
        await loadRom(data.name, data.bytes);
        break;
      case "configureAudio":
        configureAudio(data.buffer, data.capacityFrames);
        break;
      case "start":
        start();
        break;
      case "pause":
        pause();
        break;
      case "reset":
        requireCore();
        flushAudioRing();
        core._bsnes_web_reset();
        runFrame();
        break;
      case "setButton":
        requireCore();
        core._bsnes_web_set_button(
          data.player,
          data.button,
          data.pressed ? 1 : 0,
        );
        break;
      case "saveState":
        saveState();
        break;
      case "loadState":
        flushAudioRing();
        loadState(data.bytes);
        break;
      case "shutdown":
        pause();
        if (core && initialized) core._bsnes_web_shutdown();
        self.close();
        break;
      default:
        throw new Error(`Unknown emulator command: ${String(data.type)}`);
    }
  } catch (error) {
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
