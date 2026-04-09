/**
 * iOS standalone (Safari “Add to Home Screen”) splash screens.
 *
 * Each PNG is exactly imgW×imgH px under `public/splash/` as `apple-{imgW}x{imgH}.png`.
 * Background is a **linear gradient** (see `IOS_SPLASH_GRADIENT_*`) baked in at export time
 * via `scripts/generate-ios-splash.ts` + Inkscape.
 *
 * Generate: `bun run splash:ios`
 *
 * Deduped from Apple HIG–aligned lists (e.g. pwa-asset-generator’s fallback data).
 */

/** Gradient top → bottom (#a3d926ff → #185e63ff). */
export const IOS_SPLASH_GRADIENT_TOP = "#a3d926";
export const IOS_SPLASH_GRADIENT_BOTTOM = "#185e63";

const PORTRAIT_SPLASH_SPECS = [
  { imgW: 2048, imgH: 2732, dpr: 2 },
  { imgW: 1668, imgH: 2388, dpr: 2 },
  { imgW: 1668, imgH: 2224, dpr: 2 },
  { imgW: 1536, imgH: 2048, dpr: 2 },
  { imgW: 1640, imgH: 2360, dpr: 2 },
  { imgW: 1620, imgH: 2160, dpr: 2 },
  { imgW: 1488, imgH: 2266, dpr: 2 },
  { imgW: 1320, imgH: 2868, dpr: 3 },
  { imgW: 1206, imgH: 2622, dpr: 3 },
  { imgW: 1290, imgH: 2796, dpr: 3 },
  { imgW: 1284, imgH: 2778, dpr: 3 },
  { imgW: 1179, imgH: 2556, dpr: 3 },
  { imgW: 1170, imgH: 2532, dpr: 3 },
  { imgW: 1125, imgH: 2436, dpr: 3 },
  { imgW: 1242, imgH: 2688, dpr: 3 },
  { imgW: 828, imgH: 1792, dpr: 2 },
  { imgW: 1242, imgH: 2208, dpr: 3 },
  { imgW: 750, imgH: 1334, dpr: 2 },
  { imgW: 640, imgH: 1136, dpr: 2 },
] as const;

function mediaForPortraitSpec(spec: (typeof PORTRAIT_SPLASH_SPECS)[number]): string {
  const logicalW = spec.imgW / spec.dpr;
  const logicalH = spec.imgH / spec.dpr;
  return [
    "screen",
    `(device-width: ${logicalW}px)`,
    `(device-height: ${logicalH}px)`,
    `(-webkit-device-pixel-ratio: ${spec.dpr})`,
    "(orientation: portrait)",
  ].join(" and ");
}

/** Next.js `metadata.appleWebApp.startupImage` entries (portrait only). */
export function iosPortraitStartupImages(basePath: string) {
  const prefix = basePath;
  return PORTRAIT_SPLASH_SPECS.map((spec) => ({
    url: `${prefix}/splash/apple-${spec.imgW}x${spec.imgH}.png`,
    media: mediaForPortraitSpec(spec),
  }));
}

/** Filenames to generate under `public/splash/` (Inkscape script). */
export const IOS_PORTRAIT_SPLASH_FILENAMES = PORTRAIT_SPLASH_SPECS.map(
  (s) => `apple-${s.imgW}x${s.imgH}.png`,
);
