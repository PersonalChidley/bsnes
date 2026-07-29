export const SNES_BUTTONS = [
  "b",
  "y",
  "select",
  "start",
  "up",
  "down",
  "left",
  "right",
  "a",
  "x",
  "l",
  "r",
] as const;

export type SnesButton = (typeof SNES_BUTTONS)[number];

export const SNES_BUTTON_ID: Record<SnesButton, number> = {
  b: 0,
  y: 1,
  select: 2,
  start: 3,
  up: 4,
  down: 5,
  left: 6,
  right: 7,
  a: 8,
  x: 9,
  l: 10,
  r: 11,
};

export type EmulatorCommand =
  | { type: "init" }
  | { type: "loadRom"; name: string; bytes: ArrayBuffer }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "setButton"; player: number; button: number; pressed: boolean }
  | { type: "saveState" }
  | { type: "loadState"; bytes: ArrayBuffer }
  | { type: "shutdown" };

export type EmulatorEvent =
  | { type: "status"; status: "loading" | "ready" | "running" | "paused" }
  | { type: "romLoaded"; name: string; fps: number }
  | {
      type: "frame";
      width: number;
      height: number;
      pixels: ArrayBuffer;
    }
  | { type: "audio"; sampleRate: number; samples: ArrayBuffer }
  | { type: "state"; bytes: ArrayBuffer }
  | { type: "error"; message: string };
