/**
 * Rutas donde `AppShell` pinta `DriftingMeshBackground` a ancho completo del
 * `<main>` (junto al sidebar). Añade entradas aquí si otras pantallas lo necesitan.
 */
export const MAIN_DRIFT_MESH_PATHS = ["/sync-shared"] as const;

export function shouldShowMainDriftMesh(pathname: string): boolean {
  return MAIN_DRIFT_MESH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
