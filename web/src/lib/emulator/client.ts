import {
  SNES_BUTTON_ID,
  SNES_BUTTONS,
  type EmulatorCommand,
  type EmulatorEvent,
  type SnesButton,
} from "./protocol";

type EventHandler = (event: EmulatorEvent) => void;

export class EmulatorClient {
  private readonly worker: Worker;
  private readonly inputSources = Array.from({ length: 2 }, () =>
    SNES_BUTTONS.map(() => new Set<string>()),
  );

  constructor(onEvent: EventHandler) {
    this.worker = new Worker("/emulator/emulator.worker.js", { type: "module" });
    this.worker.addEventListener("message", (message: MessageEvent<EmulatorEvent>) => {
      onEvent(message.data);
    });
    this.worker.addEventListener("error", () => {
      onEvent({
        type: "error",
        message: "The emulator worker stopped unexpectedly.",
      });
    });
    this.send({ type: "init" });
  }

  loadRom(file: File) {
    void file.arrayBuffer().then((bytes) => {
      this.loadRomBytes(file.name, bytes);
    });
  }

  loadRomBytes(name: string, bytes: ArrayBuffer) {
    this.send({ type: "loadRom", name, bytes }, [bytes]);
  }

  configureAudio(buffer: SharedArrayBuffer, capacityFrames: number) {
    this.send({ type: "configureAudio", buffer, capacityFrames });
  }

  start() {
    this.send({ type: "start" });
  }

  pause() {
    this.send({ type: "pause" });
  }

  reset() {
    this.send({ type: "reset" });
  }

  setButton(
    button: SnesButton,
    pressed: boolean,
    player = 0,
    source = "default",
  ) {
    if (player < 0 || player >= this.inputSources.length) return;

    const buttonId = SNES_BUTTON_ID[button];
    const sources = this.inputSources[player][buttonId];
    const wasPressed = sources.size > 0;
    if (pressed) {
      sources.add(source);
    } else {
      sources.delete(source);
    }

    if (wasPressed === (sources.size > 0)) return;
    this.send({
      type: "setButton",
      player,
      button: buttonId,
      pressed: sources.size > 0,
    });
  }

  clearInputSource(source: string, player?: number) {
    const firstPlayer = player ?? 0;
    const lastPlayer = player ?? this.inputSources.length - 1;

    for (
      let playerIndex = firstPlayer;
      playerIndex <= lastPlayer;
      playerIndex += 1
    ) {
      if (playerIndex < 0 || playerIndex >= this.inputSources.length) continue;
      this.inputSources[playerIndex].forEach((sources, button) => {
        const wasPressed = sources.size > 0;
        sources.delete(source);
        if (wasPressed && sources.size === 0) {
          this.send({
            type: "setButton",
            player: playerIndex,
            button,
            pressed: false,
          });
        }
      });
    }
  }

  syncButtons() {
    this.inputSources.forEach((buttons, player) => {
      buttons.forEach((sources, button) => {
        this.send({
          type: "setButton",
          player,
          button,
          pressed: sources.size > 0,
        });
      });
    });
  }

  saveState() {
    this.send({ type: "saveState" });
  }

  loadState(bytes: ArrayBuffer) {
    this.send({ type: "loadState", bytes }, [bytes]);
  }

  destroy() {
    this.send({ type: "shutdown" });
    this.worker.terminate();
  }

  private send(command: EmulatorCommand, transfer: Transferable[] = []) {
    this.worker.postMessage(command, transfer);
  }
}
