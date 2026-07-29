import {
  SNES_BUTTON_ID,
  type EmulatorCommand,
  type EmulatorEvent,
  type SnesButton,
} from "./protocol";

type EventHandler = (event: EmulatorEvent) => void;

export class EmulatorClient {
  private readonly worker: Worker;

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
      this.send({ type: "loadRom", name: file.name, bytes }, [bytes]);
    });
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

  setButton(button: SnesButton, pressed: boolean, player = 0) {
    this.send({
      type: "setButton",
      player,
      button: SNES_BUTTON_ID[button],
      pressed,
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
