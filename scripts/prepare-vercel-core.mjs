import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const EMSCRIPTEN_VERSION = "6.0.5";
const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const coreFiles = [
  path.join(projectDirectory, "public", "emulator", "bsnes-core.mjs"),
  path.join(projectDirectory, "public", "emulator", "bsnes-core.wasm"),
];

if (
  process.env.BSNES_FORCE_CORE_BUILD !== "1" &&
  coreFiles.every((file) => existsSync(file) && statSync(file).size > 0)
) {
  console.log("Using the existing bsnes WebAssembly core.");
  process.exit(0);
}

let buildEnvironment = { ...process.env };
if (!commandSucceeds("em++", ["--version"], buildEnvironment)) {
  if (process.platform !== "win32") {
    buildEnvironment = installEmscripten();
  }
}

run(
  process.execPath,
  [path.join(projectDirectory, "scripts", "build-core.mjs")],
  buildEnvironment,
);

if (!coreFiles.every((file) => existsSync(file) && statSync(file).size > 0)) {
  fail("The Emscripten build completed without producing both core artifacts.");
}

function installEmscripten() {
  const cacheDirectory = path.join(projectDirectory, ".cache");
  const emsdkDirectory =
    process.env.BSNES_VERCEL_EMSDK?.trim() ||
    path.join(cacheDirectory, `emsdk-${EMSCRIPTEN_VERSION}`);
  const emsdkScript = path.join(emsdkDirectory, "emsdk.py");
  mkdirSync(cacheDirectory, { recursive: true });

  if (!existsSync(emsdkScript)) {
    if (existsSync(emsdkDirectory)) {
      fail(
        `The Emscripten cache is incomplete at ${emsdkDirectory}. Remove it and redeploy.`,
      );
    }
    console.log(`Downloading Emscripten SDK ${EMSCRIPTEN_VERSION}…`);
    run(
      "git",
      [
        "clone",
        "--depth",
        "1",
        "--branch",
        EMSCRIPTEN_VERSION,
        "https://github.com/emscripten-core/emsdk.git",
        emsdkDirectory,
      ],
      process.env,
    );
  }

  const python = findPython();
  run(python, [emsdkScript, "install", EMSCRIPTEN_VERSION], process.env);
  run(python, [emsdkScript, "activate", EMSCRIPTEN_VERSION], process.env);

  return {
    ...process.env,
    EMSDK: emsdkDirectory,
    EM_CONFIG: path.join(emsdkDirectory, ".emscripten"),
    PATH: [
      path.join(emsdkDirectory, "upstream", "emscripten"),
      process.env.PATH ?? "",
    ].join(path.delimiter),
  };
}

function findPython() {
  for (const candidate of ["python3", "python"]) {
    if (commandSucceeds(candidate, ["--version"], process.env)) {
      return candidate;
    }
  }
  fail("Python 3 is required to install Emscripten during the Vercel build.");
}

function commandSucceeds(command, arguments_, environment) {
  const result = spawnSync(command, arguments_, {
    cwd: projectDirectory,
    env: environment,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function run(command, arguments_, environment) {
  const result = spawnSync(command, arguments_, {
    cwd: projectDirectory,
    env: environment,
    stdio: "inherit",
  });
  if (result.error) fail(`Unable to start ${command}: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`${command} exited with status ${result.status ?? "unknown"}.`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
