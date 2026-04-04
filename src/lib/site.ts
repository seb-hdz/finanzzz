/** Matches `basePath` in next.config (GitHub Pages). */
export function getBasePath(): string {
  return process.env.NODE_ENV === "production" ? "/finanzzz" : "";
}

export function getSyncSharedPath(): string {
  return `${getBasePath()}/sync-shared`;
}
