#!/usr/bin/env node
// Limpia archivos del repo que tengan padding de bytes nulos (corrupcion comun
// causada por la sincronizacion fallida de OneDrive). Ejecutar:
//
//   node scripts/clean-onedrive-corruption.mjs
//
// Recorre apps/, backend/, packages/ y elimina los bytes nulos (\0) de cada
// archivo fuente. No toca contenido valido. Reporta cada archivo limpiado.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");

const TARGETS = ["apps", "backend", "packages"];
const EXTS = new Set([".ts", ".tsx", ".css", ".json", ".js", ".mjs"]);
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "dist-ssr",
  ".turbo",
  ".vite",
  "coverage",
]);

let cleanedCount = 0;
let scannedCount = 0;

const walk = (dir) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full);
      continue;
    }
    if (!EXTS.has(path.extname(entry.name))) continue;
    scannedCount += 1;
    let buf;
    try {
      buf = fs.readFileSync(full);
    } catch {
      continue;
    }
    const cleaned = buf.filter((b) => b !== 0x00);
    if (cleaned.length !== buf.length) {
      const removed = buf.length - cleaned.length;
      fs.writeFileSync(full, cleaned);
      cleanedCount += 1;
      console.log(`Limpiado: ${path.relative(ROOT, full)} (${removed} bytes nulos)`);
    }
  }
};

for (const target of TARGETS) {
  const full = path.join(ROOT, target);
  if (fs.existsSync(full)) walk(full);
}

console.log("");
console.log(`Archivos escaneados: ${scannedCount}`);
console.log(`Archivos limpiados: ${cleanedCount}`);
process.exit(0);
