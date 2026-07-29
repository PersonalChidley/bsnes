import {
  AUDIO_RING,
  AUDIO_RING_HEADER_BYTES,
  availableAudioFrames,
} from "./audio-ring";
import type { EmulatorClient } from "./client";

const BUFFER_SECONDS = 0.5;
const START_BUFFER_SECONDS = 0.08;
const TARGET_BUFFER_SECONDS = 0.06;

export type AudioPlaybackStats = {
  bufferedMilliseconds: number;
  capacityMilliseconds: number;
  correctionPpm: number;
  deviceLatencyMilliseconds: number;
  outputSampleRate: number;
  overruns: number;
  sourceSampleRate: number;
  underruns: number;
};

export class AudioPlayback {
  private capacityFrames = 0;
  private context: AudioContext | null = null;
  private header: Int32Array | null = null;
  private node: AudioWorkletNode | null = null;
  private sourceSampleRate = 0;

  async start(client: EmulatorClient, sourceSampleRate: number) {
    await this.ensureConfigured(client, sourceSampleRate);
    if (!this.context || !this.header) {
      throw new Error("The browser audio pipeline could not be initialized.");
    }

    this.flush(true);
    await this.context.resume();
    if (this.context.state !== "running") {
      throw new Error(
        "The browser blocked audio startup. Press Play again after allowing audio for this site.",
      );
    }
    Atomics.store(this.header, AUDIO_RING.active, 1);
  }

  async pause() {
    if (!this.header || !this.context) return;
    Atomics.store(this.header, AUDIO_RING.active, 0);
    this.flush(false);
    if (this.context.state === "running") await this.context.suspend();
  }

  reset() {
    this.flush(false);
  }

  getStats(): AudioPlaybackStats | null {
    if (!this.context || !this.header || !this.sourceSampleRate) return null;

    const bufferedFrames = availableAudioFrames(
      this.header,
      this.capacityFrames,
    );
    const outputLatency =
      "outputLatency" in this.context ? this.context.outputLatency : 0;

    return {
      bufferedMilliseconds:
        (bufferedFrames / this.sourceSampleRate) * 1000,
      capacityMilliseconds:
        (this.capacityFrames / this.sourceSampleRate) * 1000,
      correctionPpm: Atomics.load(
        this.header,
        AUDIO_RING.correctionPpm,
      ),
      deviceLatencyMilliseconds:
        (this.context.baseLatency + outputLatency) * 1000,
      outputSampleRate: this.context.sampleRate,
      overruns: Atomics.load(this.header, AUDIO_RING.overruns),
      sourceSampleRate: this.sourceSampleRate,
      underruns: Atomics.load(this.header, AUDIO_RING.underruns),
    };
  }

  async destroy() {
    if (this.header) Atomics.store(this.header, AUDIO_RING.active, 0);
    this.node?.disconnect();
    this.node = null;
    this.header = null;
    this.capacityFrames = 0;
    this.sourceSampleRate = 0;

    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
  }

  private async ensureConfigured(
    client: EmulatorClient,
    sourceSampleRate: number,
  ) {
    if (!Number.isFinite(sourceSampleRate) || sourceSampleRate <= 0) {
      throw new Error("The emulator reported an invalid audio sample rate.");
    }
    if (
      typeof SharedArrayBuffer === "undefined" ||
      !globalThis.crossOriginIsolated
    ) {
      throw new Error(
        "Shared audio memory requires cross-origin isolation. Restart the local web server and reload this page.",
      );
    }
    if (this.context && this.sourceSampleRate === sourceSampleRate) return;

    await this.destroy();

    const context = new AudioContext({ latencyHint: "interactive" });
    try {
      await context.audioWorklet.addModule("/emulator/audio-worklet.js");

      const capacityFrames = nextPowerOfTwo(
        Math.ceil(sourceSampleRate * BUFFER_SECONDS),
      );
      const sharedBuffer = new SharedArrayBuffer(
        AUDIO_RING_HEADER_BYTES +
          capacityFrames *
            AUDIO_RING.channels *
            Int16Array.BYTES_PER_ELEMENT,
      );
      const header = new Int32Array(
        sharedBuffer,
        0,
        AUDIO_RING.headerLength,
      );
      const node = new AudioWorkletNode(context, "bsnes-audio-processor", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [AUDIO_RING.channels],
        processorOptions: {
          buffer: sharedBuffer,
          capacityFrames,
          sourceSampleRate,
          startBufferFrames: Math.ceil(
            sourceSampleRate * START_BUFFER_SECONDS,
          ),
          targetBufferFrames: Math.ceil(
            sourceSampleRate * TARGET_BUFFER_SECONDS,
          ),
        },
      });
      node.connect(context.destination);

      this.context = context;
      this.node = node;
      this.header = header;
      this.capacityFrames = capacityFrames;
      this.sourceSampleRate = sourceSampleRate;
      client.configureAudio(sharedBuffer, capacityFrames);
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  private flush(resetMetrics: boolean) {
    if (!this.header) return;

    const writeFrame = Atomics.load(
      this.header,
      AUDIO_RING.writeFrame,
    );
    Atomics.store(this.header, AUDIO_RING.readFrame, writeFrame);
    Atomics.add(this.header, AUDIO_RING.epoch, 1);
    Atomics.store(this.header, AUDIO_RING.correctionPpm, 0);

    if (resetMetrics) {
      Atomics.store(this.header, AUDIO_RING.underruns, 0);
      Atomics.store(this.header, AUDIO_RING.overruns, 0);
      Atomics.store(this.header, AUDIO_RING.producedFrames, 0);
      Atomics.store(this.header, AUDIO_RING.consumedFrames, 0);
    }
  }
}

function nextPowerOfTwo(value: number) {
  return 2 ** Math.ceil(Math.log2(value));
}
