#!/usr/bin/env node
/**
 * generate-icons.js
 * Generates PWA PNG icons from the SVG source using the system sharp/canvas.
 * Run: node generate-icons.js
 * Requires: npm install sharp  (or use the canvas-based fallback below)
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "..", "icons");
const SVG_PATH = path.join(ICONS_DIR, "icon.svg");

// --- Try sharp (fast, no native deps on most systems) ------------------
async function trySharp() {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    return null;
  }
}

async function generateWithSharp(sharp) {
  const svgBuf = fs.readFileSync(SVG_PATH);

  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-maskable-192.png", size: 192 },
    { name: "icon-maskable-512.png", size: 512 },
    { name: "screenshot-wide.png", width: 1280, height: 720 },
  ];

  for (const spec of sizes) {
    const outPath = path.join(ICONS_DIR, spec.name);
    if (spec.width) {
      // Landscape screenshot placeholder
      await sharp({
        create: {
          width: spec.width,
          height: spec.height,
          channels: 4,
          background: { r: 10, g: 0, b: 0, alpha: 1 },
        },
      })
        .composite([{ input: svgBuf, gravity: "center" }])
        .png()
        .toFile(outPath);
    } else {
      await sharp(svgBuf).resize(spec.size, spec.size).png().toFile(outPath);
    }
    console.log(`  ✔  ${spec.name}`);
  }
}

// --- Fallback: generate solid-colour placeholder PNGs ------------------
// A minimal 1×1 red PNG, upscaled via sharp is preferred.
// Without sharp we write a raw RGB PNG at the right size.
function writeFallbackPng(outPath, width, height, r, g, b) {
  function crc32(buf) {
    let crc = -1;
    for (const byte of buf) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  // Pre-build CRC table
  const CRC_TABLE = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw scanlines (filter byte 0 + RGB pixels)
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter
    for (let x = 0; x < width; x++) {
      const off = y * rowSize + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const idat = zlib.deflateSync(raw);

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outPath, png);
  console.log(`  ✔  ${path.basename(outPath)} (solid-colour fallback)`);
}

// -----------------------------------------------------------------------
(async () => {
  if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR);

  const sharp = await trySharp();

  if (sharp) {
    console.log("Generating PNG icons with sharp…");
    await generateWithSharp(sharp);
  } else {
    console.log("sharp not found — writing solid-colour placeholder PNGs.");
    console.log("Run `npm install sharp` for proper icon rendering.\n");
    // Dark red background (#0a0000) as placeholder
    for (const [name, w, h] of [
      ["icon-192.png", 192, 192],
      ["icon-512.png", 512, 512],
      ["icon-maskable-192.png", 192, 192],
      ["icon-maskable-512.png", 512, 512],
      ["screenshot-wide.png", 1280, 720],
    ]) {
      writeFallbackPng(path.join(ICONS_DIR, name), w, h, 10, 0, 0);
    }
  }

  console.log("\nDone! All icons written to icons/");
})();
