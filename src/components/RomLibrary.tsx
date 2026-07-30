"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  RomLibraryEntry,
  RomLibraryResponse,
} from "@/lib/rom-library";

type RomLibraryProps = {
  disabled: boolean;
  onSelect: (name: string, bytes: ArrayBuffer) => void;
};

type LibraryState =
  | { status: "loading"; roms: RomLibraryEntry[]; message: string }
  | { status: "ready"; roms: RomLibraryEntry[]; message?: string }
  | { status: "unavailable"; roms: RomLibraryEntry[]; message: string };

const INITIAL_STATE: LibraryState = {
  status: "loading",
  roms: [],
  message: "Scanning local library…",
};

export function RomLibrary({ disabled, onSelect }: RomLibraryProps) {
  const [library, setLibrary] = useState<LibraryState>(INITIAL_STATE);
  const [selectedName, setSelectedName] = useState("");
  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLibrary() {
      try {
        const response = await fetch("/api/roms", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as RomLibraryResponse;

        if (!response.ok || !result.enabled) {
          setLibrary({
            status: "unavailable",
            roms: [],
            message: result.message ?? "The local ROM library is unavailable.",
          });
          return;
        }

        setLibrary({
          status: "ready",
          roms: result.roms,
          message: result.message,
        });
        setSelectedName((current) => current || result.roms[0]?.name || "");
      } catch (error) {
        if (controller.signal.aborted) return;
        setLibrary({
          status: "unavailable",
          roms: [],
          message:
            error instanceof Error
              ? error.message
              : "The local ROM library is unavailable.",
        });
      }
    }

    void loadLibrary();
    return () => controller.abort();
  }, []);

  const selectedRom = useMemo(
    () => library.roms.find((rom) => rom.name === selectedName),
    [library.roms, selectedName],
  );

  async function loadSelectedRom() {
    if (!selectedRom || loadingName) return;

    setLoadError(null);
    setLoadingName(selectedRom.name);
    try {
      const response = await fetch(
        `/api/roms/${encodeURIComponent(selectedRom.name)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(result?.message ?? "The selected ROM could not be read.");
      }

      onSelect(selectedRom.name, await response.arrayBuffer());
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The selected ROM could not be read.",
      );
    } finally {
      setLoadingName(null);
    }
  }

  const unavailable = library.status !== "ready" || library.roms.length === 0;
  const controlsDisabled = disabled || unavailable || Boolean(loadingName);

  return (
    <div className="rom-library">
      <div className="rom-library-heading">
        <p className="panel-label">Local library</p>
        {library.status === "ready" && library.roms.length > 0 ? (
          <span>{library.roms.length} games</span>
        ) : null}
      </div>

      <select
        aria-label="Select a ROM from the local library"
        disabled={controlsDisabled}
        value={selectedName}
        onChange={(event) => setSelectedName(event.currentTarget.value)}
      >
        {library.roms.length > 0 ? (
          library.roms.map((rom) => (
            <option key={rom.name} value={rom.name}>
              {rom.name} · {formatBytes(rom.size)}
            </option>
          ))
        ) : (
          <option value="">No local ROMs found</option>
        )}
      </select>

      <button
        className="library-load-button"
        type="button"
        disabled={controlsDisabled}
        onClick={() => void loadSelectedRom()}
      >
        {loadingName ? "Loading…" : "Load selected game"}
      </button>

      {library.status !== "ready" || library.message || loadError ? (
        <p
          className={`library-message ${loadError ? "is-error" : ""}`}
          role={loadError ? "alert" : "status"}
        >
          {loadError ?? library.message}
        </p>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
