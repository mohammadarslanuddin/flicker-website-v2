#!/usr/bin/env node
/*
 * Tiny zero-dependency static server for the Flicker Home page.
 *
 * Why not just open index.html? The page loads its components as
 * <script type="text/babel"> and Babel fetches them over HTTP, which the
 * browser blocks on file://. This serves the folder so those fetches work.
 *
 * Serves dotfiles (needed for .image-slots.state.json), disables caching so
 * edits show on reload, and falls forward a few ports if 8000 is taken.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT) || 8000;
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jsx": "text/babel; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json; charset=utf-8",
};

const server = http.createServer((req, res) => {
  // Strip query string + decode, then resolve safely inside ROOT.
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, path.normalize(urlPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("404 Not Found");
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream(filePath).pipe(res);
  });
});

function listen(port, attemptsLeft) {
  server.once("error", (e) => {
    if (e.code === "EADDRINUSE" && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
    } else {
      console.error(e.message);
      process.exit(1);
    }
  });
  server.listen(port, HOST, () => {
    console.log(`\n  Flicker Home running →  http://localhost:${port}\n  (serving ${ROOT})\n  Press Ctrl+C to stop.\n`);
  });
}

listen(START_PORT, 10);
