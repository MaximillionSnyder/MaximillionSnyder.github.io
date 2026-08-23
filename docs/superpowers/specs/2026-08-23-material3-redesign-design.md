# Rediseño Material 3 mobile-first — Uma Afinidad

Fecha: 2026-08-23 · Estado: aprobado

## Problema

La app Android es una TWA que muestra la web tal cual. La UI actual es
desktop-first (tabs en el header, panel lateral sticky que en móvil apila
abajo, estados hover, sin safe areas), por lo que se siente como "una web"
y no como una app nativa.

## Objetivo

Que la app se sienta como una app Android normal: rediseño **mobile-first
completo** con **Material 3**, paleta derivada del naranja actual
(`#f08c3a`) como semilla, implementado con **CSS/vanilla JS artesanal**
(sin dependencias nuevas).

No se cambia: lógica de afinidad (`affinity.js`), datos, SW/manifest,
TWA/APK/tags. El APK existente carga el sitio vivo, así que el rediseño
llega solo con deployar la web.

## Decisiones de diseño

### Navegación

- **Móvil**: app bar compacta arriba (solo título). Bottom navigation bar
  fija con 2 destinos: *Compatibilidad* (ícono corazón) y *Grupos*
  (ícono grupo), indicador activo tipo píldora tonal. Padding inferior
  con `env(safe-area-inset-bottom)`.
- **Desktop (≥840px)**: navegación superior tipo segmented buttons y
  layout de dos columnas (grilla | panel de resultados sticky).

### Vista Compatibilidad (móvil)

1. Search bar M3 sticky bajo el app bar.
2. Grilla de personajes: cards M3 (avatar circular tonal + nombre).
   Selección con borde/check en primary y micro-animación.
3. Barra de selección flotante sobre la bottom nav (visible al elegir
   ≥1): mini-avatars seleccionados, contador `n/3`, botón filled
   "Ver afinidad".
4. Bottom sheet modal con drag handle y scrim para los resultados:
   pares/tríos con ranks GREAT/GOOD/FAIR como chips tonales
   (verde/amarillo/rojo). Cierra con swipe-down o tap en scrim.
   Reutiliza `result.js` apuntando al contenedor del sheet.
5. En desktop el mismo contenido va al panel lateral (sin sheet).

### Vista Grupos (móvil)

- Filtro de puntos mínimos como filter chips horizontales scrolleables.
- Lista de grupos como cards expandibles M3.

### Tokens Material 3 (dark only)

- Roles de color en tonos M3 derivados de la semilla naranja:
  `primary` (~tono 80), `on-primary`, `primary-container`,
  `on-primary-container`; superficies `surface-container`
  (low/high/highest) sobre base `#14161a`; `outline-variant`; `scrim`.
- Tipografía: escala M3 con `system-ui`/Roboto.
- Shape: radios 12 / 16 / full (píldoras).
- Elevación: sombras suaves niveles 1–3.
- State layers: hover 8% / pressed 12%; hover solo bajo
  `@media (hover:hover)`.
- Pulido nativo: `-webkit-tap-highlight-color: transparent`,
  `user-select: none` en UI cromada, `touch-action: manipulation`,
  `overscroll-behavior: contain` en el sheet,
  `viewport-fit=cover` + insets para edge-to-edge.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `index.html` | Reestructura: app bar sin tabs, bottom nav, barra de selección, markup del sheet, viewport-fit |
| `src/styles.css` | Reescrito: tokens M3 + componentes (~600 líneas) |
| `src/main.js` | Wiring de navegación, sheet y barra de selección |
| `src/ui/*.js` | Mismos renders apuntando a los nuevos contenedores; íconos SVG inline |

Sin cambios: `twa-manifest.json`, workflows, datos, service worker
(se regenera solo con el build de Vite).

## Verificación

1. `npm run build` y revisión local en viewport móvil (DevTools).
2. Push a `main` → workflow Deploy publica automáticamente.
3. Chequeo manual en teléfono real (TWA instalada) y de
   `/manifest.webmanifest` e íconos en vivo.

## Fuera de alcance

- Light theme, colores dinámicos Material You.
- Cambios de lógica o de datos.
- Nueva versión del APK/tag (innecesario: la TWA sirve contenido vivo).
