const UMBRALES = [
  { min: 20, simbolo: '◎', clase: 'rank-great' },
  { min: 10, simbolo: '○', clase: 'rank-good' },
  { min: 4, simbolo: '△', clase: 'rank-fair' },
];

export function crearModelo({ characters, relations, members }) {
  const porId = new Map(characters.map((c) => [c.char_id, c]));
  const puntoPorTipo = new Map(relations.map((r) => [r.relation_type, r.relation_point]));

  const tiposPorChar = new Map();
  const miembrosPorTipo = new Map();
  for (const m of members) {
    if (!tiposPorChar.has(m.chara_id)) tiposPorChar.set(m.chara_id, new Set());
    tiposPorChar.get(m.chara_id).add(m.relation_type);
    if (!miembrosPorTipo.has(m.relation_type)) miembrosPorTipo.set(m.relation_type, []);
    miembrosPorTipo.get(m.relation_type).push(m.chara_id);
  }

  function gruposCompartidos(ids) {
    if (ids.length < 2) return [];
    const [primero, ...resto] = ids.map((id) => tiposPorChar.get(id) ?? new Set());
    return [...primero]
      .filter((tipo) => resto.every((set) => set.has(tipo)))
      .map((tipo) => ({ tipo, puntos: puntoPorTipo.get(tipo) ?? 0 }))
      .sort((a, b) => b.puntos - a.puntos || a.tipo - b.tipo);
  }

  function puntajePar(a, b) {
    if (a === b) return 0;
    return gruposCompartidos([a, b]).reduce((total, g) => total + g.puntos, 0);
  }

  function puntajeTrio(ids) {
    let total = 0;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) total += puntajePar(ids[i], ids[j]);
    }
    return total;
  }

  function rango(puntos) {
    return UMBRALES.find((u) => puntos >= u.min) ?? null;
  }

  function gruposDeChar(id) {
    return [...(tiposPorChar.get(id) ?? [])]
      .map((tipo) => ({
        tipo,
        puntos: puntoPorTipo.get(tipo) ?? 0,
        miembros: (miembrosPorTipo.get(tipo) ?? []).map((mid) => porId.get(mid)?.en_name ?? mid),
      }))
      .sort((a, b) => b.puntos - a.puntos || a.tipo - b.tipo);
  }

  function todosLosGrupos() {
    return relations
      .map((r) => ({ tipo: r.relation_type, puntos: r.relation_point, cantidad: (miembrosPorTipo.get(r.relation_type) ?? []).length }))
      .sort((a, b) => b.puntos - a.puntos || b.cantidad - a.cantidad || a.tipo - b.tipo);
  }

  function miembrosDeGrupo(tipo) {
    return (miembrosPorTipo.get(tipo) ?? []).map((id) => porId.get(id)).filter(Boolean);
  }

  return {
    personajes: characters,
    porId,
    gruposCompartidos,
    puntajePar,
    puntajeTrio,
    rango,
    gruposDeChar,
    todosLosGrupos,
    miembrosDeGrupo,
  };
}
