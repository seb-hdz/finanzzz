#!/usr/bin/env bun
/**
 * Builds `public/splash/apple-*.png` for iOS PWA startup images via Inkscape.
 * Source: `public/icons/icon-512.svg` (must stay path-independent inside the wrapper SVG).
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { IOS_PORTRAIT_SPLASH_FILENAMES } from "../src/lib/ios-splash-portrait";

const INKSCAPE = "/Applications/Inkscape.app/Contents/MacOS/inkscape";
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICON_SVG = join(REPO_ROOT, "public", "icons", "icon-512.svg");
const OUT_DIR = join(REPO_ROOT, "public", "splash");

/** ~27% of the shorter side keeps the mark similar to the old GM example on phone sizes. */
function iconBox(canvasW: number, canvasH: number): { s: number; x: number; y: number } {
  const s = Math.max(96, Math.round(Math.min(canvasW, canvasH) * 0.27));
  const x = Math.round((canvasW - s) / 2);
  const y = Math.round((canvasH - s) / 2);
  return { s, x, y };
}

function parseSplashFilename(name: string): { w: number; h: number } | null {
  const m = /^apple-(\d+)x(\d+)\.png$/.exec(name);
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]) };
}

function buildWrapperSvg(canvasW: number, canvasH: number, iconHref: string): string {
  const { s, x, y } = iconBox(canvasW, canvasH);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <rect width="${canvasW}" height="${canvasH}" fill="#0a0a0a"/>
  <image xlink:href="${iconHref}" href="${iconHref}" x="${x}" y="${y}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

function main() {
  if (!existsSync(INKSCAPE)) {
    console.error(`Inkscape not found at ${INKSCAPE}`);
    process.exit(1);
  }
  if (!existsSync(ICON_SVG)) {
    console.error(`Missing icon: ${ICON_SVG}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const iconHref = pathToFileURL(ICON_SVG).href;
  const tmpDir = mkdtempSync(join(tmpdir(), "finanzzz-splash-"));

  try {
    for (const filename of IOS_PORTRAIT_SPLASH_FILENAMES) {
      const dims = parseSplashFilename(filename);
      if (!dims) continue;
      const { w, h } = dims;
      const svgPath = join(tmpDir, `wrap-${w}x${h}.svg`);
      const pngPath = join(OUT_DIR, filename);
      writeFileSync(svgPath, buildWrapperSvg(w, h, iconHref), "utf8");

      const r = spawnSync(
        INKSCAPE,
        ["-w", String(w), "-h", String(h), svgPath, "-o", pngPath],
        { stdio: "inherit" },
      );
      if (r.status !== 0) {
        console.error(`Inkscape failed for ${filename} (exit ${r.status})`);
        process.exit(r.status ?? 1);
      }
      console.log(pngPath);
    }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
