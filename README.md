# afinidad

Visor de personajes y afinidad de Uma Musume con datos datamined.

Proyecto independiente (side project): vanilla JS + ES modules, cero
dependencias de runtime. Se publica como **web (PWA)** en GitHub Pages y como
**app Android (TWA)** en Google Play desde esta única base de código.

## Datos

`npm run fetch` descarga las tablas datamined:

- `data/characters.json` — personajes (char_id, en_name, jp_name, url_name…)
- `data/succession_relation.json` — grupos de afinidad y sus puntos
- `data/succession_relation_member.json` — membresía personaje ↔ grupo

Flag: `--dry-run`. Siempre se bajan las tablas base (sin prefijo de idioma),
que son las únicas completas; son numéricas, así que no hay texto por idioma
(los nombres localizados ya vienen en `characters.json`).

La fuente es un manifiesto público de datos datamined; cada clave resuelve a
un JSON versionado con hash.

## Uso

```bash
npm run fetch    # actualizar datos
npm run dev      # servidor de desarrollo
npm run build    # build de producción a dist/
npm run preview  # servir dist/
npm run icons    # regenerar íconos PNG desde scripts/generate-icons.mjs
```

## Afinidad

Puntaje de un par = suma de `relation_point` de los grupos (`relation_type`)
que comparten ambos personajes según las tablas datamined. Ej.: el grupo 101
agrupa a los rivales (Kitasan Black, Satono Diamond, Cheval Grand…).

## PWA

El build genera todo lo necesario para instalar la web como app:

- `public/manifest.webmanifest` — nombre, colores e íconos (192/512 + maskable)
- `dist/sw.js` — service worker generado por el plugin inline de
  `vite.config.js`: precachea todo el sitio (JS, CSS, datos JSON, íconos) con
  hash de versión, sirve offline con estrategia *stale-while-revalidate* para
  assets y *network-first* para la navegación.

Para actualizar íconos: editar `scripts/generate-icons.mjs` o
`public/favicon.svg` y correr `npm run icons`.

## Deploy web (GitHub Pages)

Cada push a `main` dispara `.github/workflows/deploy.yml`, que compila y
publica `dist/` en:

```
https://maximillionsnyder.github.io/
```

Requisito único (una vez): en el repo → Settings → Pages → Source =
**GitHub Actions**.

## App Android (build en GitHub Actions)

La app es una **TWA** (Trusted Web Activity): un contenedor oficial que abre
la PWA a pantalla completa, sin código nativo que mantener. Los contenidos
son idénticos por definición y cada deploy web actualiza la app.

El workflow `.github/workflows/android.yml` compila con
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) en runners de
GitHub y produce `app-release-bundle.aab` (Play Store) +
`app-release-signed.apk` (instalación directa). No requiere Android SDK
local. Se dispara manualmente o al pushear un tag `v*`.

### Primera vez (bootstrap)

1. Actions → **Android** → Run workflow → escribir `keystore_password`
   (una contraseña larga que elijas vos). El resto se genera solo.
2. Descargar el artifact `keystore-bootstrap-N`: contiene
   `android.keystore` + `assetlinks.json`, cifrado con esa contraseña.
   **Guardar ese keystore** — sin él no hay actualizaciones en Play.
3. Crear los secrets del repo (Settings → Secrets and variables → Actions):
   - `ANDROID_KEYSTORE_BASE64` = `base64 -w0 android.keystore`
   - `ANDROID_KEYSTORE_PASSWORD` = la contraseña elegida
   - `ANDROID_KEY_PASSWORD` = ídem
4. Borrar el artifact bootstrap.
5. Copiar el `assetlinks.json` del summary/artifact a
   `public/.well-known/assetlinks.json` y committear: verifica el dominio
   contra la firma y elimina la barra de URL.

### Corridas siguientes

- Botón *Run workflow* (sin password): usa los secrets y firma igual.
- Tag para release: `git tag v1.0.1 && git push --tags` → crea GitHub Release
  con AAB+APK. El `versionCode` es automático (`run number`) así que siempre
  sube; Play Console exige que sea mayor al publicado.

Notas: registro en Play USD 25 una vez; cuentas personales nuevas requieren
testing cerrado (~12 testers durante 14 días); la TWA carga la PWA live,
que ya funciona offline gracias al service worker.

Alternativa sin CI: <https://www.pwabuilder.com> genera el `.aab` desde la
URL del sitio (mismo resultado, menos reproducible).

## Estructura

```
├── data/          # JSON datamined (committeados)
├── public/        # manifest, íconos, favicon
├── scripts/       # fetch de datos + generador de íconos
├── src/           # app (vanilla JS + ES modules)
└── .github/workflows/deploy.yml
```

Nota Termux: los scripts llaman a Vite vía `node` directo porque el shebang
`#!/usr/bin/env` de `node_modules/.bin` no resuelve fuera del prefijo de
Termux. Funciona igual en CI/Linux estándar.
