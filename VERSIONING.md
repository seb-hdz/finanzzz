# Commits y versionado

Guía breve para este repo. El despliegue a GitHub Pages se dispara con cada push a `main`; la versión que ve el usuario en producción sale de `package.json` + datos que inyecta CI (run, SHA, fecha).

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
- **patch** (0.1.**1**): correcciones pequeñas, sin cambio de comportamiento relevante para la usuaria.
- **minor** (0.**2**.0): funcionalidad nueva compatible con lo anterior.
- **major** (**1**.0.0): cambios que rompen expectativas guardadas, datos o flujos (cuando aplique).

Varios commits en `main` pueden compartir la misma versión; para soporte y depuración se usará además el identificador de build que genera GitHub Actions.

## Release y ramas

### Si trabajas solo con `main`

1. Actualiza `"version"` en `package.json` cuando quieras publicar un número nuevo (mismo commit que el cambio o commit dedicado `chore: bump version to x.y.z`).
2. Push a `main` → el workflow construye y despliega.

### Si usas `develop` (u otra rama de integración)

1. Integra trabajo en `develop` con commits que sigan la convención de arriba.
2. Para **soltar** una versión: sube el `version` en la rama que vaya a fusionarse a `main` (suele ser el PR de `develop` → `main`, o un commit en `main` justo después del merge).
3. Merge a `main` y push; el deploy usa el `package.json` ya actualizado.

Regla práctica: **lo que esté en `package.json` en el commit que despliega Pages es la versión semver que debe mostrar la app**; no hace falta tag git para este flujo, salvo que quieras usarlos por costumbre.

## Override de versión en CI (excepcional)

En GitHub: **Actions** → workflow **Deploy to GitHub Pages** → **Run workflow**. El campo **app_version_override** pisa el semver mostrado en la app sin editar `package.json`. Déjalo vacío en el día a día; la fuente habitual debe ser `package.json`.
