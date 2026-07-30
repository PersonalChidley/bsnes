"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AudioPlayback,
  type AudioPlaybackStats,
} from "@/lib/emulator/audio";
import { EmulatorClient } from "@/lib/emulator/client";
import {
  GamepadInput,
  type GamepadAssignment,
} from "@/lib/emulator/gamepad";
import type { EmulatorEvent, SnesButton } from "@/lib/emulator/protocol";
import {
  DEFAULT_VIDEO_SETTINGS,
  loadVideoSettings,
  saveVideoSettings,
  VIDEO_FILTERS,
  type VideoAspect,
  type VideoFilterId,
  type VideoScale,
  type VideoSettings,
} from "@/lib/emulator/video";

import {
  EmulatorCanvas,
  type EmulatorCanvasHandle,
} from "./EmulatorCanvas";
import { RomLibrary } from "./RomLibrary";
import { RomPicker } from "./RomPicker";

type CoreStatus = "loading" | "ready" | "running" | "paused" | "error";
type AudioStatus = "idle" | "starting" | "playing" | "paused" | "error";

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
  const audioRef = useRef<AudioPlayback | null>(null);
  const gamepadRef = useRef<GamepadInput | null>(null);
  const canvasRef = useRef<EmulatorCanvasHandle | null>(null);
  const configuredVideoRef = useRef<string | null>(null);
  const [status, setStatus] = useState<CoreStatus>("loading");
  const [statusText, setStatusText] = useState("Loading WebAssembly core…");
  const [romName, setRomName] = useState<string | null>(null);
  const [frame, setFrame] = useState<ImageData | null>(null);
  const [audioSampleRate, setAudioSampleRate] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const [audioMessage, setAudioMessage] = useState(
    "Audio starts when you press Play.",
  );
  const [audioStats, setAudioStats] = useState<AudioPlaybackStats | null>(
    null,
  );
  const [gamepads, setGamepads] = useState<GamepadAssignment[]>([]);
  const [gamepadSupported, setGamepadSupported] = useState(true);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(
    DEFAULT_VIDEO_SETTINGS,
  );
  const [videoSettingsLoaded, setVideoSettingsLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

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
        if (event.status === "paused") {
          void audioRef.current?.pause();
        }
        break;
      case "romLoaded":
        setRomName(event.name);
        setAudioSampleRate(event.audioSampleRate);
        gamepadRef.current?.resync();
        audioRef.current?.reset();
        setAudioStatus("paused");
        setAudioMessage(
          `Ready for ${formatHertz(event.audioSampleRate)} stereo playback.`,
        );
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
        void audioRef.current?.pause();
        setAudioStatus("error");
        setAudioMessage("Audio stopped because the emulator reported an error.");
        setStatus("error");
        setStatusText(event.message);
        break;
      case "audio":
        // Transferable PCM remains a compatibility fallback until Play
        // configures the shared AudioWorklet ring buffer.
        break;
    }
  }, []);

  useEffect(() => {
    const audio = new AudioPlayback();
    const client = new EmulatorClient(handleEvent);
    const gamepad = new GamepadInput(client, setGamepads);
    audioRef.current = audio;
    clientRef.current = client;
    gamepadRef.current = gamepad;
    const supportTimer = window.setTimeout(() => {
      setGamepadSupported(typeof navigator.getGamepads === "function");
    }, 0);
    gamepad.start();
    return () => {
      window.clearTimeout(supportTimer);
      gamepad.destroy();
      void audio.destroy();
      client.destroy();
      gamepadRef.current = null;
      audioRef.current = null;
      clientRef.current = null;
    };
  }, [handleEvent]);

  useEffect(() => {
    gamepadRef.current?.setEnabled(Boolean(romName));
  }, [romName]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVideoSettings(loadVideoSettings());
      setVideoSettingsLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!videoSettingsLoaded) return;
    saveVideoSettings(videoSettings);
    if (status !== "loading" && status !== "error") {
      const serialized = JSON.stringify({
        filter: videoSettings.filter,
        overscan: videoSettings.overscan,
        hiresBlur: videoSettings.hiresBlur,
      });
      if (configuredVideoRef.current !== serialized) {
        configuredVideoRef.current = serialized;
        clientRef.current?.configureVideo(videoSettings);
      }
    }
  }, [status, videoSettings, videoSettingsLoaded]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAudioStats(audioRef.current?.getStats() ?? null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateButton = (event: KeyboardEvent, pressed: boolean) => {
      const button = KEYBOARD_MAP[event.code];
      if (!button || !romName) return;
      event.preventDefault();
      clientRef.current?.setButton(button, pressed, 0, "keyboard");
    };

    const keyDown = (event: KeyboardEvent) => {
      if (!event.repeat) updateButton(event, true);
    };
    const keyUp = (event: KeyboardEvent) => updateButton(event, false);
    const releaseKeyboard = () => {
      clientRef.current?.clearInputSource("keyboard", 0);
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", releaseKeyboard);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", releaseKeyboard);
      releaseKeyboard();
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

  const prepareRomLoad = useCallback(() => {
    void audioRef.current?.pause();
    setAudioStatus("idle");
    setAudioStats(null);
    setAudioMessage("Audio starts when you press Play.");
  }, []);

  const handlePlay = useCallback(async () => {
    const client = clientRef.current;
    const audio = audioRef.current;
    if (!client || !audio || !audioSampleRate) return;

    setAudioStatus("starting");
    setAudioMessage("Starting low-latency audio…");
    try {
      await audio.start(client, audioSampleRate);
      setAudioStatus("playing");
      setAudioMessage("AudioWorklet playback is active.");
    } catch (error) {
      setAudioStatus("error");
      setAudioMessage(
        error instanceof Error ? error.message : "Audio could not start.",
      );
    }
    client.start();
  }, [audioSampleRate]);

  const handlePause = useCallback(() => {
    clientRef.current?.pause();
    void audioRef.current?.pause();
    setAudioStatus("paused");
    setAudioMessage("Audio paused.");
  }, []);

  const handleReset = useCallback(() => {
    audioRef.current?.reset();
    clientRef.current?.reset();
  }, []);

  return (
    <section className="emulator-shell">
      <div className="shell-heading">
        <div>
          <p className="eyebrow">Browser port · milestone one</p>
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
          <EmulatorCanvas
            ref={canvasRef}
            frame={frame}
            settings={videoSettings}
            onFullscreenChange={setFullscreen}
          />
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
            onSelect={(file) => {
              prepareRomLoad();
              clientRef.current?.loadRom(file);
            }}
          />

          <RomLibrary
            disabled={!coreReady}
            onSelect={(name, bytes) => {
              prepareRomLoad();
              clientRef.current?.loadRomBytes(name, bytes);
            }}
          />

          <div className="button-row">
            <button
              type="button"
              disabled={
                !canControl ||
                status === "running" ||
                audioStatus === "starting"
              }
              onClick={() => void handlePlay()}
            >
              Play
            </button>
            <button
              type="button"
              disabled={!canControl || status !== "running"}
              onClick={handlePause}
            >
              Pause
            </button>
            <button
              type="button"
              disabled={!canControl}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          <div className="video-card">
            <div className="video-heading">
              <p className="panel-label">Video</p>
              <button
                className="video-fullscreen-button"
                type="button"
                onClick={() => void canvasRef.current?.toggleFullscreen()}
              >
                {fullscreen ? "Exit fullscreen" : "Fullscreen"}
              </button>
            </div>

            <label className="video-field">
              <span>bsnes filter</span>
              <select
                value={videoSettings.filter}
                onChange={(event) => {
                  setVideoSettings((current) => ({
                    ...current,
                    filter: Number(event.target.value) as VideoFilterId,
                  }));
                }}
              >
                {VIDEO_FILTERS.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="video-field-row">
              <label className="video-field">
                <span>Aspect</span>
                <select
                  value={videoSettings.aspect}
                  onChange={(event) => {
                    setVideoSettings((current) => ({
                      ...current,
                      aspect: event.target.value as VideoAspect,
                    }));
                  }}
                >
                  <option value="corrected">Corrected</option>
                  <option value="square">Square pixels</option>
                  <option value="4:3">4:3</option>
                </select>
              </label>
              <label className="video-field">
                <span>Scaling</span>
                <select
                  value={videoSettings.scale}
                  onChange={(event) => {
                    setVideoSettings((current) => ({
                      ...current,
                      scale: event.target.value as VideoScale,
                    }));
                  }}
                >
                  <option value="fit">Fit</option>
                  <option value="integer">Integer</option>
                </select>
              </label>
            </div>

            <label className="video-toggle">
              <input
                type="checkbox"
                checked={videoSettings.overscan}
                onChange={(event) => {
                  setVideoSettings((current) => ({
                    ...current,
                    overscan: event.target.checked,
                  }));
                }}
              />
              <span>Show overscan area</span>
            </label>
            <label className="video-toggle">
              <input
                type="checkbox"
                checked={videoSettings.hiresBlur}
                onChange={(event) => {
                  setVideoSettings((current) => ({
                    ...current,
                    hiresBlur: event.target.checked,
                  }));
                }}
              />
              <span>Hires blur emulation</span>
            </label>
            <p className="video-message">
              Software filters run in the bsnes core on the next emulated
              frame. Display preferences stay in this browser.
            </p>
          </div>

          <div className="audio-card">
            <div className="audio-heading">
              <p className="panel-label">Audio</p>
              <span className={`audio-state audio-${audioStatus}`}>
                {audioStatus}
              </span>
            </div>
            <p className="audio-message" role="status">
              {audioMessage}
            </p>
            {audioStats ? (
              <dl className="audio-stats">
                <div>
                  <dt>Buffer</dt>
                  <dd>
                    {audioStats.bufferedMilliseconds.toFixed(0)} ms
                  </dd>
                </div>
                <div>
                  <dt>Drift correction</dt>
                  <dd>{formatCorrection(audioStats.correctionPpm)}</dd>
                </div>
                <div>
                  <dt>Output</dt>
                  <dd>
                    {formatHertz(audioStats.outputSampleRate)} ·{" "}
                    {audioStats.deviceLatencyMilliseconds.toFixed(0)} ms
                  </dd>
                </div>
                <div>
                  <dt>Underruns / overruns</dt>
                  <dd>
                    {audioStats.underruns} / {audioStats.overruns}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>

          <div className="controller-card">
            <div className="controller-heading">
              <p className="panel-label">Controllers</p>
              <span className="controller-count">
                {gamepads.length}/2 connected
              </span>
            </div>
            {!gamepadSupported ? (
              <p className="controller-message">
                This browser does not expose the Gamepad API.
              </p>
            ) : gamepads.length ? (
              <ol className="controller-assignments">
                {gamepads.map((gamepad) => (
                  <li key={gamepad.index}>
                    <span className="controller-player">
                      P{gamepad.player + 1}
                    </span>
                    <span
                      className="controller-name"
                      title={gamepad.id || `Controller ${gamepad.index + 1}`}
                    >
                      {gamepad.id || `Controller ${gamepad.index + 1}`}
                    </span>
                    <span className="controller-mapping">
                      {gamepad.mapping === "standard" ? "Standard" : "Generic"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="controller-message">
                Connect a USB or Bluetooth controller, then press a button to
                let the browser detect it.
              </p>
            )}
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

function formatHertz(sampleRate: number) {
  return `${(sampleRate / 1000).toFixed(sampleRate % 1000 ? 1 : 0)} kHz`;
}

function formatCorrection(correctionPpm: number) {
  if (!correctionPpm) return "0 ppm";
  return `${correctionPpm > 0 ? "+" : ""}${correctionPpm} ppm`;
}
