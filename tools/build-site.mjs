// Builds the website into dist/ (used by Vercel: see vercel.json).
// Downloads the background-removal model for the pinned version, builds vendor/,
// then copies only the files the page needs.
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

execSync("node tools/update-model.mjs --pinned", { cwd: root, stdio: "inherit" });

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist);
await fs.copyFile(path.join(root, "index.html"), path.join(dist, "index.html"));
for (const d of ["bgdata", "vendor"]) await fs.cp(path.join(root, d), path.join(dist, d), { recursive: true });

const files = await fs.readdir(dist, { recursive: true });
console.log(`dist/ ready: ${files.length} entries`);
