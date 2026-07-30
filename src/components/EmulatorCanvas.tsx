"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import type { VideoSettings } from "@/lib/emulator/video";

type EmulatorCanvasProps = {
  frame: ImageData | null;
  settings: VideoSettings;
  onFullscreenChange: (fullscreen: boolean) => void;
};

export type EmulatorCanvasHandle = {
  toggleFullscreen: () => Promise<void>;
};

type ViewportSize = {
  width: number;
  height: number;
};

export const EmulatorCanvas = forwardRef<
  EmulatorCanvasHandle,
  EmulatorCanvasProps
>(function EmulatorCanvas({ frame, settings, onFullscreenChange }, ref) {
  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;

    canvas.width = frame.width;
    canvas.height = frame.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.putImageData(frame, 0, 0);
  }, [frame]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === screenRef.current;
      setFullscreen(active);
      onFullscreenChange(active);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  const toggleFullscreen = async () => {
    const screen = screenRef.current;
    if (!screen) return;
    try {
      if (document.fullscreenElement === screen) {
        await document.exitFullscreen();
      } else {
        await screen.requestFullscreen();
      }
    } catch (error) {
      console.error("[bsnes] Fullscreen request failed.", error);
    }
  };

  useImperativeHandle(ref, () => ({ toggleFullscreen }));

  const displayAspect = getDisplayAspect(settings);
  const canvasSize = useMemo(
    () => getCanvasSize(viewport, displayAspect, settings),
    [displayAspect, settings, viewport],
  );

  return (
    <div
      ref={screenRef}
      className="screen-frame"
      data-scale={settings.scale}
      style={{ aspectRatio: displayAspect }}
    >
      <canvas
        ref={canvasRef}
        className="emulator-canvas"
        width={512}
        height={448}
        style={canvasSize}
        aria-label="SNES emulator display"
      />
      {!frame ? (
        <div className="screen-placeholder" aria-hidden="true">
          <span>BSNES</span>
          <small>WebAssembly display</small>
        </div>
      ) : null}
      <button
        className="fullscreen-button"
        type="button"
        aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        aria-pressed={fullscreen}
        onClick={() => void toggleFullscreen()}
      >
        {fullscreen ? "Exit fullscreen" : "Fullscreen"}
      </button>
    </div>
  );
});

function getDisplayAspect(settings: VideoSettings) {
  if (settings.aspect === "4:3") return 4 / 3;
  const height = settings.overscan ? 240 : 224;
  const pixelAspect = settings.aspect === "corrected" ? 8 / 7 : 1;
  return (256 * pixelAspect) / height;
}

function getCanvasSize(
  viewport: ViewportSize,
  aspect: number,
  settings: VideoSettings,
) {
  if (!viewport.width || !viewport.height) {
    return { width: "100%", height: "100%" };
  }

  let width =
    viewport.width / viewport.height > aspect
      ? viewport.height * aspect
      : viewport.width;
  let height = width / aspect;

  if (settings.scale === "integer") {
    const baseHeight = settings.overscan ? 240 : 224;
    const baseWidth = baseHeight * aspect;
    const integerScale = Math.floor(
      Math.min(viewport.width / baseWidth, viewport.height / baseHeight),
    );
    if (integerScale >= 1) {
      width = baseWidth * integerScale;
      height = baseHeight * integerScale;
    }
  }

  return {
    width: `${Math.floor(width)}px`,
    height: `${Math.floor(height)}px`,
  };
}
