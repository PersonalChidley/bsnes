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

const HEADER_BYTES =
  AUDIO_RING.headerLength * Int32Array.BYTES_PER_ELEMENT;
const MAX_CORRECTION = 0.005;
const CORRECTION_GAIN = 0.002;

class BsnesAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    const {
      buffer,
      capacityFrames,
      sourceSampleRate,
      startBufferFrames,
      targetBufferFrames,
    } = options.processorOptions;

    this.capacityFrames = capacityFrames;
    this.sourceSampleRate = sourceSampleRate;
    this.startBufferFrames = startBufferFrames;
    this.targetBufferFrames = targetBufferFrames;
    this.header = new Int32Array(
      buffer,
      0,
      AUDIO_RING.headerLength,
    );
    this.samples = new Int16Array(
      buffer,
      HEADER_BYTES,
      capacityFrames * AUDIO_RING.channels,
    );
    this.epoch = Atomics.load(this.header, AUDIO_RING.epoch);
    this.fraction = 0;
    this.started = false;
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    const left = output[0];
    const right = output[1] ?? output[0];
    left.fill(0);
    right.fill(0);

    if (Atomics.load(this.header, AUDIO_RING.active) === 0) {
      this.started = false;
      this.fraction = 0;
      Atomics.store(this.header, AUDIO_RING.correctionPpm, 0);
      return true;
    }

    const epoch = Atomics.load(this.header, AUDIO_RING.epoch);
    if (epoch !== this.epoch) {
      this.epoch = epoch;
      this.started = false;
      this.fraction = 0;
    }

    let readFrame = Atomics.load(
      this.header,
      AUDIO_RING.readFrame,
    ) >>> 0;
    const writeFrame = Atomics.load(
      this.header,
      AUDIO_RING.writeFrame,
    ) >>> 0;
    let availableFrames = Math.min(
      (writeFrame - readFrame) >>> 0,
      this.capacityFrames,
    );

    if (!this.started) {
      if (availableFrames < this.startBufferFrames) return true;
      this.started = true;
    }

    if (availableFrames < 2) {
      this.recordUnderrun();
      return true;
    }

    const bufferError =
      (availableFrames - this.targetBufferFrames) /
      this.targetBufferFrames;
    const correction = clamp(
      bufferError * CORRECTION_GAIN,
      -MAX_CORRECTION,
      MAX_CORRECTION,
    );
    const sourceFramesPerOutputFrame =
      (this.sourceSampleRate / sampleRate) * (1 + correction);
    Atomics.store(
      this.header,
      AUDIO_RING.correctionPpm,
      Math.round(correction * 1_000_000),
    );

    let consumedFrames = 0;
    for (let outputFrame = 0; outputFrame < left.length; outputFrame += 1) {
      if (availableFrames < 2) {
        this.recordUnderrun();
        break;
      }

      const current =
        (readFrame % this.capacityFrames) * AUDIO_RING.channels;
      const next =
        ((readFrame + 1) % this.capacityFrames) * AUDIO_RING.channels;
      left[outputFrame] =
        interpolate(
          this.samples[current],
          this.samples[next],
          this.fraction,
        ) / 32768;
      right[outputFrame] =
        interpolate(
          this.samples[current + 1],
          this.samples[next + 1],
          this.fraction,
        ) / 32768;

      this.fraction += sourceFramesPerOutputFrame;
      const advance = Math.floor(this.fraction);
      if (advance > 0) {
        readFrame = (readFrame + advance) >>> 0;
        availableFrames -= advance;
        consumedFrames += advance;
        this.fraction -= advance;
      }
    }

    Atomics.store(
      this.header,
      AUDIO_RING.readFrame,
      readFrame | 0,
    );
    if (consumedFrames > 0) {
      Atomics.add(
        this.header,
        AUDIO_RING.consumedFrames,
        consumedFrames,
      );
    }
    return true;
  }

  recordUnderrun() {
    if (this.started) {
      Atomics.add(this.header, AUDIO_RING.underruns, 1);
    }
    this.started = false;
    this.fraction = 0;
    Atomics.store(this.header, AUDIO_RING.correctionPpm, 0);
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function interpolate(start, end, fraction) {
  return start + (end - start) * fraction;
}

registerProcessor("bsnes-audio-processor", BsnesAudioProcessor);
