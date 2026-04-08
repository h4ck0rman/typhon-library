/**
 * Simple local static file server for development testing.
 *
 * Serves the dist/ directory on localhost:3456 so you can point the
 * Typhon MCP server at http://localhost:3456 as a library URL.
 */

import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = 3456;

const MIME_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".gz": "application/gzip",
  ".html": "text/html",
  ".txt": "text/plain",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  // Handle .tar.gz specially
  if (filePath.endsWith(".tar.gz")) return "application/gzip";
  return MIME_TYPES[ext] || "application/octet-stream";
}

const server = http.createServer((req, res) => {
  // CORS headers for local development
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
    return;
  }

  const urlPath = req.url?.split("?")[0] || "/";
  let filePath: string;

  if (urlPath === "/") {
    filePath = path.join(DIST_DIR, "typhon-library.json");
  } else {
    // Prevent directory traversal
    const normalized = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
    filePath = path.join(DIST_DIR, normalized);
  }

  // Ensure we stay within dist/
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const mimeType = getMimeType(filePath);
  const content = fs.readFileSync(filePath);

  res.writeHead(200, { "Content-Type": mimeType });
  res.end(content);
});

// Check dist/ exists
if (!fs.existsSync(DIST_DIR)) {
  console.error("dist/ directory not found. Run 'npm run build' first.");
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`Typhon library dev server running at http://localhost:${PORT}`);
  console.log(`Serving files from ${DIST_DIR}`);
  console.log(`\nAdd this URL to Typhon: http://localhost:${PORT}`);
  console.log(`\nPress Ctrl+C to stop.`);
});
