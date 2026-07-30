import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const make = process.env.MAKE ?? "make";
const makeArguments = [
  "-C",
  "bsnes",
  "target=web",
  "binary=library",
  "platform=web",
  "compiler=em++",
  "build=release",
  "openmp=false",
  "local=false",
  "web.output=../public/emulator",
];

const compilerCheck = spawnSync("em++", ["--version"], {
  cwd: projectDirectory,
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (compilerCheck.status === 0) {
  const result = spawnSync(make, makeArguments, {
    cwd: projectDirectory,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(
      `Unable to start ${make}. Install GNU Make (MSYS2 on Windows) and try again.`,
    );
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

if (process.platform === "win32") {
  const wslStatus = buildWithWsl();
  if (wslStatus !== null) process.exit(wslStatus);
}

console.error(
  "Emscripten was not found. Activate emsdk so `em++` is on PATH, or install emsdk beside the repository for the Windows WSL fallback.",
);
process.exit(1);

function buildWithWsl() {
  const wsl = "wsl.exe";
  const distributionArguments = process.env.BSNES_WSL_DISTRO
    ? ["-d", process.env.BSNES_WSL_DISTRO]
    : [];
  const wslProjectDirectory = toWslPath(
    wsl,
    distributionArguments,
    projectDirectory,
  );
  if (!wslProjectDirectory) return null;

  const defaultWindowsEmsdk = path.resolve(
    projectDirectory,
    "..",
    "emsdk",
  );
  const wslEmsdk =
    process.env.BSNES_WSL_EMSDK ??
    toWslPath(
      wsl,
      distributionArguments,
      defaultWindowsEmsdk,
    );
  if (!wslEmsdk) return null;

  const windowsEmsdk = process.env.BSNES_WSL_EMSDK
    ? toWindowsPath(wsl, distributionArguments, wslEmsdk)
    : defaultWindowsEmsdk;
  const wslNodeBin =
    process.env.BSNES_WSL_NODE_BIN ??
    (windowsEmsdk ? activeWslNodeBin(windowsEmsdk, wslEmsdk) : null);
  if (!wslNodeBin) return null;

  const command = [
    `export EMSDK=${shellQuote(wslEmsdk)}`,
    `export EMSDK_NODE=${shellQuote(`${wslNodeBin}/node`)}`,
    `export PATH=${shellQuote(`${wslEmsdk}/upstream/emscripten`)}:${shellQuote(wslNodeBin)}:/usr/bin:/bin`,
    `cd ${shellQuote(wslProjectDirectory)}`,
    [make, ...makeArguments].map(shellQuote).join(" "),
  ].join(" && ");

  const result = spawnSync(
    wsl,
    [
      ...distributionArguments,
      "--",
      "bash",
      "-lc",
      command,
    ],
    {
      cwd: projectDirectory,
      stdio: "inherit",
    },
  );

  return result.status ?? 1;
}

function toWslPath(wsl, distributionArguments, windowsPath) {
  const result = spawnSync(
    wsl,
    [
      ...distributionArguments,
      "--",
      "wslpath",
      "-a",
      windowsPath.replaceAll("\\", "/"),
    ],
    {
      cwd: projectDirectory,
      encoding: "utf8",
    },
  );

  return result.status === 0 ? result.stdout.trim() : null;
}

function toWindowsPath(wsl, distributionArguments, wslPath) {
  const result = spawnSync(
    wsl,
    [...distributionArguments, "--", "wslpath", "-w", wslPath],
    {
      cwd: projectDirectory,
      encoding: "utf8",
    },
  );

  return result.status === 0 ? result.stdout.trim() : null;
}

function activeWslNodeBin(windowsEmsdk, wslEmsdk) {
  try {
    const configuration = readFileSync(
      path.join(windowsEmsdk, ".emscripten"),
      "utf8",
    );
    const match = configuration.match(
      /^NODE_JS = '\$CFGDIR\/(.+)\/node'\r?$/m,
    );
    return match ? `${wslEmsdk}/${match[1]}` : null;
  } catch {
    return null;
  }
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\"'\"'")}'`;
}
