// Tiny local web server for Cutout Studio. Usage: node server.mjs [--open]
// Serving from localhost (instead of opening the HTML file directly) lets the browser
// cache the AI models and run them on several CPU threads.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 8420;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const URL_ = `http://localhost:${PORT}/`;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".wasm": "application/wasm", ".woff2": "font/woff2", ".png": "image/png",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".onnx": "application/octet-stream",
};
const PUBLIC = ["index.html", "vendor", "bgdata", "models"];

function openBrowser() {
  if (!process.argv.includes("--open")) return;
  const cmd = process.platform === "win32" ? `start "" ${URL_}` : process.platform === "darwin" ? `open ${URL_}` : `xdg-open ${URL_}`;
  exec(cmd);
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, URL_).pathname).replace(/^\/+/, "") || "index.html";
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep) || !PUBLIC.some(d => p === d || p.startsWith(d + "/"))) { res.writeHead(404); return res.end("Not found"); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] || "application/octet-stream",
      "content-length": st.size,
      // cross-origin isolation: enables multi-threaded WebAssembly (faster AI)
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
      "cache-control": p === "index.html" ? "no-cache" : "max-age=3600",
    });
    fs.createReadStream(file).pipe(res);
  });
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") { console.log(`Cutout Studio is already running at ${URL_}`); openBrowser(); setTimeout(() => process.exit(0), 500); }
  else throw e;
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Cutout Studio is running at ${URL_}\nKeep this window open while you use it. Close it to stop.`);
  openBrowser();
});
