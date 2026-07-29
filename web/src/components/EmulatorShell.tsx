"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmulatorClient } from "@/lib/emulator/client";
import type { EmulatorEvent, SnesButton } from "@/lib/emulator/protocol";

import { EmulatorCanvas } from "./EmulatorCanvas";
import { RomPicker } from "./RomPicker";

type CoreStatus = "loading" | "ready" | "running" | "paused" | "error";

const KEYBOARD_MAP: Record<string, SnesButton> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyZ: "b",
  KeyX: "a",
  KeyA: "y",
  KeyS: "x",
  KeyQ: "l",
  KeyW: "r",
  Enter: "start",
  Space: "select",
};

export function EmulatorShell() {
  const clientRef = useRef<EmulatorClient | null>(null);
  const [status, setStatus] = useState<CoreStatus>("loading");
  const [statusText, setStatusText] = useState("Loading WebAssembly core…");
  const [romName, setRomName] = useState<string | null>(null);
  const [frame, setFrame] = useState<ImageData | null>(null);

  const handleEvent = useCallback((event: EmulatorEvent) => {
    switch (event.type) {
      case "status":
        setStatus(event.status);
        setStatusText(
          {
            loading: "Loading WebAssembly core…",
            ready: "Core ready. Choose a ROM stored on your device.",
            running: "Running",
            paused: "Paused",
          }[event.status],
        );
        break;
      case "romLoaded":
        setRomName(event.name);
        setStatus("paused");
        setStatusText(`Loaded ${event.name} at ${event.fps.toFixed(2)} fps.`);
        break;
      case "frame": {
        const pixels = new Uint8ClampedArray(event.pixels);
        setFrame(new ImageData(pixels, event.width, event.height));
        break;
      }
      case "state":
        setStatusText(`Captured a ${formatBytes(event.bytes.byteLength)} save state.`);
        break;
      case "error":
        setStatus("error");
        setStatusText(event.message);
        break;
      case "audio":
        // AudioWorklet buffering is the next milestone. The typed message is
        // intentionally present now so the worker/core boundary stays stable.
        break;
    }
  }, []);

  useEffect(() => {
    const client = new EmulatorClient(handleEvent);
    clientRef.current = client;
    return () => {
      client.destroy();
      clientRef.current = null;
    };
  }, [handleEvent]);

  useEffect(() => {
    const updateButton = (event: KeyboardEvent, pressed: boolean) => {
      const button = KEYBOARD_MAP[event.code];
      if (!button || !romName) return;
      event.preventDefault();
      clientRef.current?.setButton(button, pressed);
    };

    const keyDown = (event: KeyboardEvent) => {
      if (!event.repeat) updateButton(event, true);
    };
    const keyUp = (event: KeyboardEvent) => updateButton(event, false);

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [romName]);

  const statusLabel = useMemo(() => {
    if (status === "error") return "Core unavailable";
    if (status === "loading") return "Starting";
    if (!romName) return "Ready";
    return status === "running" ? "Playing" : "Paused";
  }, [romName, status]);

  const coreReady = status !== "loading" && status !== "error";
  const canControl = coreReady && Boolean(romName);

  return (
    <section className="emulator-shell">
      <div className="shell-heading">
        <div>
          <p className="eyebrow">Browser port · milestone zero</p>
          <h1>Accuracy, carried into the browser.</h1>
          <p className="lede">
            The original bsnes C++ core runs in a dedicated worker. ROM bytes
            remain on your device and are never uploaded by this application.
          </p>
        </div>
        <span className={`status-pill status-${status}`}>{statusLabel}</span>
      </div>

      <div className="emulator-grid">
        <div>
          <EmulatorCanvas frame={frame} />
          <p className="status-message" role={status === "error" ? "alert" : "status"}>
            {statusText}
          </p>
        </div>

        <aside className="control-panel">
          <div>
            <p className="panel-label">Cartridge</p>
            <p className="rom-name">{romName ?? "No ROM selected"}</p>
          </div>

          <RomPicker
            disabled={!coreReady}
            onSelect={(file) => clientRef.current?.loadRom(file)}
          />

          <div className="button-row">
            <button
              type="button"
              disabled={!canControl || status === "running"}
              onClick={() => clientRef.current?.start()}
            >
              Play
            </button>
            <button
              type="button"
              disabled={!canControl || status !== "running"}
              onClick={() => clientRef.current?.pause()}
            >
              Pause
            </button>
            <button
              type="button"
              disabled={!canControl}
              onClick={() => clientRef.current?.reset()}
            >
              Reset
            </button>
          </div>

          <div className="keyboard-card">
            <p className="panel-label">Keyboard</p>
            <dl>
              <div>
                <dt>Move</dt>
                <dd>Arrow keys</dd>
              </div>
              <div>
                <dt>B / A</dt>
                <dd>Z / X</dd>
              </div>
              <div>
                <dt>Y / X</dt>
                <dd>A / S</dd>
              </div>
              <div>
                <dt>L / R</dt>
                <dd>Q / W</dd>
              </div>
              <div>
                <dt>Select / Start</dt>
                <dd>Space / Enter</dd>
              </div>
            </dl>
          </div>

          <p className="legal-note">
            Use only ROM images and firmware you are legally entitled to use.
          </p>
        </aside>
      </div>
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
