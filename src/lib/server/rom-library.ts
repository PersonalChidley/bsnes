import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { RomLibraryEntry } from "@/lib/rom-library";

const ROM_EXTENSIONS = new Set([".sfc", ".smc"]);
const MAX_ROM_BYTES = 64 * 1024 * 1024;

type RomLibraryConfiguration =
  | { enabled: true; root: string }
  | { enabled: false; message: string };

export function getRomLibraryConfiguration(): RomLibraryConfiguration {
  const configuredRoot = process.env.BSNES_ROM_LIBRARY_DIR?.trim();

  if (configuredRoot) {
    return {
      enabled: true,
      root: path.resolve(configuredRoot),
    };
  }

  if (process.env.NODE_ENV === "development") {
    return {
      enabled: true,
      root: path.resolve(process.cwd(), "roms", "snes"),
    };
  }

  return {
    enabled: false,
    message:
      "The local ROM library is disabled. Set BSNES_ROM_LIBRARY_DIR when starting the app to enable it.",
  };
}

export async function listRoms(root: string): Promise<RomLibraryEntry[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const roms = entries.filter(
    (entry) => entry.isFile() && isRomFilename(entry.name),
  );

  const details = await Promise.all(
    roms.map(async (entry) => {
      const file = await stat(path.join(root, entry.name));
      return {
        name: entry.name,
        size: file.size,
      };
    }),
  );

  return details
    .filter((entry) => entry.size > 0 && entry.size <= MAX_ROM_BYTES)
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
}

export async function readRom(
  root: string,
  requestedName: string,
): Promise<Uint8Array | null> {
  if (
    requestedName !== path.basename(requestedName) ||
    !isRomFilename(requestedName)
  ) {
    return null;
  }

  const libraryEntry = (await listRoms(root)).find(
    (entry) => entry.name === requestedName,
  );
  if (!libraryEntry) return null;

  return readFile(path.join(root, libraryEntry.name));
}

function isRomFilename(filename: string) {
  return ROM_EXTENSIONS.has(path.extname(filename).toLowerCase());
}
