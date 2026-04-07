# Commits y versionado

Se despliega automáticamente a **GitHub Pages** con cada push a `main`; la versión que ve el usuario en producción se obtiene desde `package.json` + datos que inyecta CI sobre la build.

## Convención de commits

Formato del **título** (una línea, ~72 caracteres):

```text
<type>(<scope>): <descripción breve>
```

- **type:** `feat` (funcionalidad), `fix` (corrección), `docs`, `chore`, `refactor`, `style`, `test`, …
- **scope:** área opcional y corta (`global`, `expenses`, `ui`, …). Si no aplica, puedes usar `chore` sin scope o scope genérico.

**Cuerpo (opcional):** tras una línea en blanco, detalles o lista. Puedes usar líneas que empiezan con `+` como viñetas legibles en el historial.

Ejemplo completo:

```text
feat(global): fix typo in markdown files extensions

+ remove unused imports in helpers
```

## Versionado (`package.json`)

- El **semver** de la app es el campo `"version"` en [`package.json`](package.json) (ej. `0.1.0`).
- **patch** (0.1.**1**): correcciones pequeñas, sin cambio de comportamiento relevante.
- **minor** (0.**2**.0): funcionalidad nueva compatible con lo anterior.
- **major** (**1**.0.0): cambios que rompen expectativas guardadas, datos o flujos (cuando aplique).

Varios commits en `main` pueden compartir la misma versión; para soporte y depuración se usará además el identificador de build que genera GitHub Actions.

## Release y ramas

### Si trabajas solo con `main`

1. Actualiza `"version"` en `package.json` cuando quieras publicar un número nuevo (mismo commit que el cambio o commit dedicado `chore: bump version to x.y.z`).
2. Push a `main` → el workflow construye y despliega.

### Si usas `develop` (u otra rama de integración)

1. Integra trabajo en `develop` con commits que sigan la convención de arriba.
2. Para **lanzar** una versión: sube el `version` en la rama que vaya a unirse a `main`.
3. Merge a `main` y push; el deploy usará el `package.json` ya actualizado.

> Regla práctica: **lo que esté en `package.json` en el commit que despliega Pages es la versión semver que mostrará la app**.

## Override de versión en CI (excepcional)

En **GitHub Actions** el workflow de **Despliegue a GitHub Pages** tiene el campo **app_version_override** para sobreescribir el semver mostrado la app por encima del `package.json`. Solo se recomienda para casos excepcionales (la fuente de verdad debe ser `package.json`).
