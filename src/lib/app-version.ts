import pkg from "../../package.json";

export type AppVersionInfo = {
  /** Semver from CI or package.json */
  semver: string;
  buildId: string | null;
  buildTimeIso: string | null;
  environment: "production" | "development";
  /** Extra build line only meaningful in production CI builds */
  showBuildDetails: boolean;
};

function trimEnv(v: string | undefined): string {
  return (v ?? "").trim();
}

export function getAppVersionInfo(): AppVersionInfo {
  const envVersion = trimEnv(process.env.NEXT_PUBLIC_APP_VERSION);
  const pkgVersion = trimEnv(pkg.version);
  const buildId = trimEnv(process.env.NEXT_PUBLIC_BUILD_ID) || null;
  const buildTimeIso = trimEnv(process.env.NEXT_PUBLIC_BUILD_TIME) || null;

  if (process.env.NODE_ENV === "development") {
    return {
      semver: pkgVersion || "0.0.0",
      buildId: null,
      buildTimeIso: null,
      environment: "development",
      showBuildDetails: false,
    };
  }

  const semver = envVersion || pkgVersion || "0.0.0";

  return {
    semver,
    buildId,
    buildTimeIso,
    environment: "production",
    showBuildDetails: Boolean(buildId || buildTimeIso),
  };
}
