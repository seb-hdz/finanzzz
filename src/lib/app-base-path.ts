/** Matches `basePath` in `next.config.ts` (dev: "", prod: "/finanzzz"). */
export const appBasePath = process.env.NODE_ENV === "production" ? "/finanzzz" : "";
