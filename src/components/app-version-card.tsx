import { getAppVersionInfo } from "@/lib/app-version";

export function AppVersionCard() {
  const info = getAppVersionInfo();
  const label = info.environment === "development" ? "-DEV" : "";

  const detailParts: string[] = [];
  if (info.buildId) detailParts.push(`build ${info.buildId}`);
  if (info.buildTimeIso) detailParts.push(info.buildTimeIso);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between gap-2">
        <p className="font-medium">Versión de la aplicación</p>
        <p className="font-medium tabular-nums">
          v{info.semver}
          {label}
        </p>
      </div>
      {info.showBuildDetails && detailParts.length > 0 ? (
        <p className="break-all text-xs text-muted-foreground">
          {detailParts.join(" · ")}
        </p>
      ) : info.environment === "development" ? (
        <p className="text-sm text-muted-foreground">
          Los datos de build (run de CI, commit, fecha) solo se rellenan en el
          sitio desplegado en GitHub Pages.
        </p>
      ) : null}
    </div>
  );
}
