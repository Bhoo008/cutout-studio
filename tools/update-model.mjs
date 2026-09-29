// Updates Cutout Studio's background remover to the newest @imgly/background-removal release.
// Usage: npm run update-model            (does nothing if already on the latest version)
//        npm run update-model -- --force (re-downloads anything missing, e.g. after a fresh clone)
// Steps: install the new library, download its model + runtime chunks into bgdata/,
// rewrite bgdata/resources.json, bump LIB_VERSION in index.html, rebuild vendor/.
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "index.html");
const dataDir = path.join(root, "bgdata");
const KEEP = [
  "/onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "/onnxruntime-web/ort-wasm-simd-threaded.mjs",
  "/models/isnet_quint8",
  "/models/isnet_fp16",
];

const html = await fs.readFile(htmlPath, "utf8");
const current = html.match(/const LIB_VERSION = "([^"]+)"/)[1];
// --pinned: fetch the files for the version the page already uses (used by the Vercel build)
const latest = process.argv.includes("--pinned") ? current
  : (await (await fetch("https://registry.npmjs.org/@imgly/background-removal/latest")).json()).version;
console.log(`Current ${current}, latest ${latest}`);
if (latest === current && !process.argv.includes("--force") && !process.argv.includes("--pinned")) { console.log("Already on the latest version."); process.exit(0); }

const base = `https://staticimgly.com/@imgly/background-removal-data/${latest}/dist/`;
const res = await fetch(base + "resources.json");
if (!res.ok) throw new Error(`No model data published for ${latest} (${res.status})`);
const all = await res.json();
const keep = {};
for (const k of KEEP) if (all[k]) keep[k] = all[k]; else console.warn("Missing in this release:", k);
for (const k of ["/onnxruntime-web/ort-wasm-simd-threaded.wasm", "/models/isnet_fp16"]) if (!keep[k]) throw new Error(`Release ${latest} lacks ${k}; the page needs changes before updating.`);

await fs.mkdir(dataDir, { recursive: true });
const wanted = new Set(Object.values(keep).flatMap(e => e.chunks.map(c => c.name)));
let fetched = 0;
for (const name of wanted) {
  const file = path.join(dataDir, name);
  try { await fs.access(file); continue; } catch {}
  const r = await fetch(base + name);
  if (!r.ok) throw new Error(`Download failed: ${name} (${r.status})`);
  await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
  fetched++; process.stdout.write(".");
}
console.log(`\nDownloaded ${fetched} new chunk(s).`);
for (const f of await fs.readdir(dataDir)) if (f !== "resources.json" && !wanted.has(f)) { await fs.unlink(path.join(dataDir, f)); console.log("Removed old chunk", f.slice(0, 12)); }
await fs.writeFile(path.join(dataDir, "resources.json"), JSON.stringify(keep));

if (latest !== current) {
  console.log(`Installing @imgly/background-removal@${latest}…`);
  execSync(`npm install --save-dev --save-exact @imgly/background-removal@${latest}`, { cwd: root, stdio: "inherit" });
  await fs.writeFile(htmlPath, html.replace(/const LIB_VERSION = "[^"]+"/, `const LIB_VERSION = "${latest}"`));
}
execSync("node tools/build-vendor.mjs", { cwd: root, stdio: "inherit" });
console.log(`Done: background remover ${latest}. Restart start.bat and try a photo before relying on it.`);
