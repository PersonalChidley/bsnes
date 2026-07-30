export const AUDIO_RING = {
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
} as const;

export const AUDIO_RING_HEADER_BYTES =
  AUDIO_RING.headerLength * Int32Array.BYTES_PER_ELEMENT;

export function availableAudioFrames(
  header: Int32Array,
  capacityFrames: number,
) {
  const writeFrame = Atomics.load(header, AUDIO_RING.writeFrame) >>> 0;
  const readFrame = Atomics.load(header, AUDIO_RING.readFrame) >>> 0;
  return Math.min((writeFrame - readFrame) >>> 0, capacityFrames);
}
