# gametora-side

Visor de personajes y afinidad de Uma Musume con los datos datamined que usa
la calculadora de compatibilidad de GameTora.

Proyecto independiente (side project): vanilla JS + ES modules, cero
dependencias. Estructurado para migrar a Vite sin refactor.

## Datos

`npm run fetch` descarga desde GameTora:

- `data/characters.json` — personajes (char_id, en_name, jp_name, url_name…)
- `data/succession_relation.json` — grupos de afinidad y sus puntos
- `data/succession_relation_member.json` — membresía personaje ↔ grupo

Flags: `--lang en|ja|ko|zh-tw` (default `en`, datos global EN), `--dry-run`.

La fuente es el manifiesto público de GameTora:
`https://gametora.com/data/manifests/umamusume.json` → cada clave resuelve a
`https://gametora.com/data/umamusume/<clave>.<hash>.json`.

## Uso

```bash
npm run fetch   # actualizar datos
npm run dev     # servir en http://localhost:5173
```

## Afinidad

Puntaje de un par = suma de `relation_point` de los grupos (`relation_type`)
que comparten ambos personajes según las tablas datamined. Ej.: el grupo 101
agrupa a los rivales (Kitasan Black, Satono Diamond, Cheval Grand…).

## Migración futura a Vite

El HTML está en la raíz y todo es ES modules con imports relativos, así que:

```bash
npm i -D vite
# agregar a scripts: "dev": "vite", "build": "vite build", "preview": "vite preview"
```

Sin cambios de estructura ni de código.
