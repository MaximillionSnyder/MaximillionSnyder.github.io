# afinidad

Visor de personajes y afinidad de Uma Musume con datos datamined.
Seleccioná hasta 7 personajes para calcular su compatibilidad o explorá
los grupos de afinidad.

## Stack

- Vanilla JS + ES modules, cero dependencias de runtime
- Vite (dev server + build)
- PWA instalable: manifest + service worker (funciona offline)
- Web publicada en GitHub Pages; app Android vía TWA

## Estructura

```
├── data/          # JSON datamined (committeados)
├── public/        # manifest, íconos, favicon
├── scripts/       # fetch de datos + generador de íconos
├── src/           # app (vanilla JS + ES modules)
└── .github/workflows/
```
