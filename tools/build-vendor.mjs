// Builds vendor/: everything the page would otherwise load from the internet.
//   vendor/engine.mjs   background removal (IMG.LY), one ES module
//   vendor/jszip.min.js, vendor/heic2any.min.js
//   vendor/fonts/       Google Fonts files + fonts.css
// Usage: node tools/build-vendor.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendor = path.join(root, "vendor");
await fs.rm(vendor, { recursive: true, force: true });
await fs.mkdir(path.join(vendor, "fonts"), { recursive: true });

// 1. engine bundle
const entry = path.join(vendor, "_entry.mjs");
await fs.writeFile(entry, `export { removeBackground } from "@imgly/background-removal";\n`);
await build({
  entryPoints: [entry], outfile: path.join(vendor, "engine.mjs"), bundle: true, format: "esm",
  platform: "browser", minify: true, logLevel: "warning", nodePaths: [path.join(root, "node_modules")],
});
await fs.rm(entry);

// 2. small helper libraries
async function download(url, file) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36" } });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (file) await fs.writeFile(file, buf);
  return buf;
}
await download("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", path.join(vendor, "jszip.min.js"));
await download("https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js", path.join(vendor, "heic2any.min.js"));

// 3. fonts: fetch the CSS as a modern browser, download each woff2, point the CSS at local files
const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Playfair+Display:wght@600&display=swap";
let css = (await download(FONTS)).toString();
const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))];
for (const [i, u] of urls.entries()) {
  const name = `f${i}.woff2`;
  await download(u, path.join(vendor, "fonts", name));
  css = css.split(u).join(name);
}
await fs.writeFile(path.join(vendor, "fonts", "fonts.css"), css);

const size = async (d) => (await Promise.all((await fs.readdir(d, { recursive: true, withFileTypes: true })).filter(e => e.isFile()).map(e => fs.stat(path.join(e.parentPath ?? e.path, e.name))))).reduce((a, s) => a + s.size, 0);
console.log(`vendor/ built: ${(await size(vendor) / 1048576).toFixed(1)} MB, ${urls.length} font files`);
