import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const make = process.env.MAKE ?? "make";

const compilerCheck = spawnSync("em++", ["--version"], {
  cwd: webDirectory,
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (compilerCheck.status !== 0) {
  console.error(
    "Emscripten was not found. Activate emsdk so `em++` is on PATH, then rerun npm run core:build.",
  );
  process.exit(1);
}

const result = spawnSync(
  make,
  [
    "-C",
    "../bsnes",
    "target=web",
    "binary=library",
    "platform=web",
    "compiler=em++",
    "build=release",
    "openmp=false",
    "local=false",
    "web.output=../web/public/emulator",
  ],
  {
    cwd: webDirectory,
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.error) {
  console.error(
    `Unable to start ${make}. Install GNU Make (MSYS2 on Windows) and try again.`,
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
