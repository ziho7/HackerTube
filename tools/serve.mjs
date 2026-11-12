#!/usr/bin/env node
// Local static preview. Hash routes are handled entirely by the browser.
import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..", "site");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon" };

export function createStaticServer(root = ROOT) {
  return createServer(async (req, res) => {
    const error = (status, message) => {
      res.writeHead(status, { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" });
      res.end(req.method === "HEAD" ? undefined : message);
    };
    if (!["GET", "HEAD"].includes(req.method)) { res.setHeader("Allow", "GET, HEAD"); error(405, "Method not allowed"); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
    catch { error(400, "Invalid URL"); return; }
    if (pathname.includes("\0")) { error(400, "Invalid path"); return; }
    try {
      const base = await realpath(root);
      let file = resolve(base, `.${pathname}`);
      const inside = (path) => path === base || path.startsWith(base + sep);
      if (!inside(file)) { error(403, "Forbidden"); return; }
      if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
      file = await realpath(file);
      if (!inside(file)) { error(403, "Forbidden"); return; }
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "content-length": body.length, "cache-control": "no-store", "x-content-type-options": "nosniff" });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (e) { error(e.code === "ENOENT" || e.code === "ENOTDIR" ? 404 : 500, e.code === "ENOENT" || e.code === "ENOTDIR" ? "Not found" : "Unable to read file"); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || "127.0.0.1";
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("PORT must be an integer from 0 to 65535");
  const server = createStaticServer().listen(port, host, () => console.log(`黑客tube → http://${host}:${server.address().port}/`));
  server.on("error", (error) => { console.error(`无法启动预览：${error.message}`); process.exitCode = 1; });
}
