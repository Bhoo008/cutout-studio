// Downloads the MI-GAN object-removal model (MIT licence) into models/ if it isn't there yet.
// Usage: node tools/fetch-eraser-model.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "models");
const BASE = "https://huggingface.co/andraniksargsyan/migan/resolve/main/";
await fs.mkdir(dir, { recursive: true });
for (const [src, dest] of [["migan_pipeline_v2.onnx", "migan_pipeline_v2.onnx"], ["LICENSE", "MIGAN-LICENSE.txt"]]) {
  const file = path.join(dir, dest);
  try { await fs.access(file); console.log(`${dest} already present`); continue; } catch {}
  const r = await fetch(BASE + src);
  if (!r.ok) throw new Error(`${src}: ${r.status}`);
  await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
  console.log(`Downloaded ${dest}`);
}
