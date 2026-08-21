import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'data');
const MANIFEST_URL = 'https://gametora.com/data/manifests/umamusume.json';
const DATA_BASE = 'https://gametora.com/data/umamusume';

const RETRIES = 3;
const USER_AGENT = 'uma-pedigree/1.0';

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES - 1) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastError;
}

function resolveUrl(manifest, key) {
  const hash = manifest[key];
  if (!hash) throw new Error(`Clave ausente en el manifiesto: ${key}`);
  return `${DATA_BASE}/${key}.${hash}.json`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('Obteniendo manifiesto de GameTora...');
  const manifest = await fetchJson(MANIFEST_URL);

  // Las tablas base (sin prefijo de idioma) son las completas y solo contienen
  // números; las versiones por idioma (en/, ko/, zh-tw/) están recortadas.
  // Los nombres localizados ya vienen en characters.json.
  const keys = {
    characters: 'characters',
    relation: 'db-files/succession_relation',
    member: 'db-files/succession_relation_member',
  };

  const files = {};
  for (const [name, key] of Object.entries(keys)) {
    const url = resolveUrl(manifest, key);
    console.log(`Descargando ${name} (${key})...`);
    files[name] = await fetchJson(url);
  }

  const chars = files.characters.filter((c) => c.playable && c.active);
  const playableIds = new Set(chars.map((c) => c.char_id));
  const members = files.member.filter((m) => playableIds.has(m.chara_id));
  const usedTypes = new Set(members.map((m) => m.relation_type));
  const relations = files.relation.filter((r) => usedTypes.has(r.relation_type));

  const gruposPorPuntos = new Map();
  for (const r of relations) {
    gruposPorPuntos.set(r.relation_point, (gruposPorPuntos.get(r.relation_point) ?? 0) + 1);
  }

  console.log(`Personajes jugables: ${chars.length}`);
  console.log(`Grupos de afinidad: ${relations.length} (${members.length} membresías)`);
  console.log(
    'Grupos por puntos:',
    [...gruposPorPuntos.entries()].sort((a, b) => b[0] - a[0]).map(([p, n]) => `${n}x${p}pt`).join(', '),
  );

  if (dryRun) return;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const output = (value) => `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'characters.json'), output(files.characters));
  fs.writeFileSync(path.join(OUT_DIR, 'succession_relation.json'), output(relations));
  fs.writeFileSync(path.join(OUT_DIR, 'succession_relation_member.json'), output(members));
  console.log(`Guardado en ${path.relative(root, OUT_DIR)}/`);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exitCode = 1;
});
