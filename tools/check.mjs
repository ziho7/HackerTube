import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
for (const dir of ["site/js", "tools", "tests"]) {
  for (const name of readdirSync(resolve(root, dir)).filter((name) => /\.(m?js)$/.test(name))) {
    const result = spawnSync(process.execPath, ["--check", resolve(root, dir, name)], { stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
console.log("JavaScript syntax checks passed.");
