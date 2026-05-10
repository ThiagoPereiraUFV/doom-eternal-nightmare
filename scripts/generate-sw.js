#!/usr/bin/env node
/**
 * generate-sw.js
 * Scans the project and rewrites the STATIC_ASSETS array in sw.js.
 * Run: node generate-sw.js  (or via  npm run generate-sw)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT   = path.resolve(__dirname, "..");
const SW_PATH = path.join(ROOT, "sw.js");

// Directories and extensions to include
const INCLUDE_DIRS = ["src", "icons"];
const ROOT_FILES   = ["index.html", "style.css", "manifest.json"];
const INCLUDE_EXTS = new Set([".js", ".css", ".html", ".json", ".png", ".svg", ".webp", ".jpg", ".jpeg", ".woff", ".woff2"]);

// Files/patterns to exclude from caching
const EXCLUDE_NAMES = new Set(["sw.js", "generate-icons.js", "generate-sw.js"]);
const EXCLUDE_DIRS  = new Set(["node_modules", ".git", "icons/icon.svg"]); // icon.svg is source only

function collectFiles(dir, base = ROOT) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel      = path.relative(base, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      results.push(...collectFiles(fullPath, base));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!INCLUDE_EXTS.has(ext))        continue;
      if (EXCLUDE_NAMES.has(entry.name)) continue;
      results.push("./" + rel);
    }
  }
  return results;
}

// Build asset list
const assets = [
  "./",
  ...ROOT_FILES.map((f) => "./" + f),
  ...INCLUDE_DIRS.flatMap((d) => collectFiles(path.join(ROOT, d))),
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

// Read current sw.js
let sw = fs.readFileSync(SW_PATH, "utf8");

// Replace the STATIC_ASSETS array (everything between the first [ and its matching ])
const formatted = assets.map((a) => `  "${a}"`).join(",\n");
const newArray   = `[\n${formatted},\n]`;

sw = sw.replace(
  /const STATIC_ASSETS\s*=\s*\[[\s\S]*?\];/,
  `const STATIC_ASSETS = ${newArray};`
);

fs.writeFileSync(SW_PATH, sw, "utf8");
console.log(`✓ sw.js updated — ${assets.length} assets cached:`);
assets.forEach((a) => console.log("  " + a));
