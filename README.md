# afinidad

Visor de personajes y afinidad de Uma Musume con los datos datamined que usa
la calculadora de compatibilidad de GameTora.

Proyecto independiente (side project): vanilla JS + ES modules, cero
dependencias de runtime. Se publica como **web (PWA)** en GitHub Pages y como
**app Android (TWA)** en Google Play desde esta única base de código.

## Datos

`npm run fetch` descarga desde GameTora:

- `data/characters.json` — personajes (char_id, en_name, jp_name, url_name…)
- `data/succession_relation.json` — grupos de afinidad y sus puntos
- `data/succession_relation_member.json` — membresía personaje ↔ grupo

Flag: `--dry-run`. Siempre se bajan las tablas base (sin prefijo de idioma),
que son las únicas completas; son numéricas, así que no hay texto por idioma
(los nombres localizados ya vienen en `characters.json`).

La fuente es el manifiesto público de GameTora:
`https://gametora.com/data/manifests/umamusume.json` → cada clave resuelve a
`https://gametora.com/data/umamusume/<clave>.<hash>.json`.

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
https://maximillionsnyder.github.io/afinidad/
```

Requisito único (una vez): en el repo → Settings → Pages → Source =
**GitHub Actions**.

## App Android (Google Play)

La app es una **TWA** (Trusted Web Activity): un contenedor oficial que abre
la PWA a pantalla completa, sin código nativo que mantener. Los contenidos
son idénticos por definición y cada deploy web actualiza la app.

Pasos (sin Android SDK local):

1. Entrar a <https://www.pwabuilder.com> y pegar la URL pública del sitio.
2. Package name sugerido: `com.maximillionsnyder.afinidad`.
3. Generar el paquete **Android** (.aab). PWABuilder crea un keystore:
   **guardar el archivo `.keystore` y las contraseñas** — sin él no se pueden
   publicar actualizaciones de la app.
4. En Play Console crear la app y subir el `.aab`.
5. Copiar el contenido de `assetlinks.json` que entrega PWABuilder a
   `public/.well-known/assetlinks.json`, redeployar. Esto verifica el dominio
   contra la firma del keystore y elimina la barra de URL de Chrome.

Notas de Play Console: registro único USD 25; las cuentas personales nuevas
requieren testing cerrado (~12 testers durante 14 días) antes de producción;
los datos ya viajan precacheados así que la app funciona offline.

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
