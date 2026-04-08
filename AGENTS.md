<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project constraints (Finanzzz)

- **Static export**: `next.config.ts` uses `output: "export"`. Do not assume SSR-only APIs, server Route Handlers for app data, or patterns that require a Node server at runtime. Prefer client-side logic and IndexedDB (Dexie).
- **Base path**: Production uses `basePath` / `assetPrefix` `/finanzzz`. Keep `appBasePath`, service worker registration, and `manifest` URLs aligned (see `src/lib/app-base-path.ts`, `src/providers/sw-provider.tsx`, `src/app/manifest.ts`).
- **Third-party Next/React skills** (e.g. from skills.sh): Treat as **hints**. If guidance conflicts with static export or this repo’s PWA/service-worker setup, follow **local** `next/dist/docs/` and the project skill `.agents/skills/finanzzz/SKILL.md`.

## Tooling

Use **Bun** for installs and scripts unless the user says otherwise: `bun install`, `bun run dev`, `bun run build`, `bun run lint`, `bunx <tool>`.

<!-- END:nextjs-agent-rules -->
