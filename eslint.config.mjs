import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "web/**",
    "out/**",
    "public/emulator/bsnes-core.*",
    "next-env.d.ts",
  ]),
]);
