"use client";

import { useEffect, useRef } from "react";

type EmulatorCanvasProps = {
  frame: ImageData | null;
};

export function EmulatorCanvas({ frame }: EmulatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <div className="screen-frame">
      <canvas
        ref={canvasRef}
        className="emulator-canvas"
        width={512}
        height={448}
        aria-label="SNES emulator display"
      />
      {!frame ? (
        <div className="screen-placeholder" aria-hidden="true">
          <span>BSNES</span>
          <small>WebAssembly display</small>
        </div>
      ) : null}
    </div>
  );
}
