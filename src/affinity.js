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

  function puntajeTrio(a, b, c) {
    return gruposCompartidos([a, b, c]).reduce((total, g) => total + g.puntos, 0);
  }

  function rango(puntos) {
    return UMBRALES.find((u) => puntos >= u.min) ?? null;
  }

  /* Umbrales del juego sobre el total de herencia: ○ ≥ 51, ◎ ≥ 151. */
  function rangoTotal(puntos) {
    if (puntos >= 151) return { simbolo: '◎', clase: 'rank-great' };
    if (puntos >= 51) return { simbolo: '○', clase: 'rank-good' };
    return { simbolo: '△', clase: 'rank-fair' };
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

  /* Trio sin allocations, para los barridos masivos del top. */
  function puntajeTrioRapido(a, b, c) {
    const sa = tiposPorChar.get(a);
    const sb = tiposPorChar.get(b);
    const sc = tiposPorChar.get(c);
    if (!sa || !sb || !sc) return 0;
    let total = 0;
    for (const tipo of sa) {
      if (sb.has(tipo) && sc.has(tipo)) total += puntoPorTipo.get(tipo) ?? 0;
    }
    return total;
  }

  let cacheTop = null;

  /* Top de linajes completos (hijo + padres + mejores abuelos por rama).
     Enumerar todos los árboles es inviable, así que: se toman los K triples
     hijo/padres de mejor base par-a-par, cada uno se expande a sus 3
     asignaciones posibles de hijo y se completa con el par de abuelos óptimo
     de cada rama (las dos relaciones hijo-padre-abuelo son independientes,
     por eso el top-2 de T(hijo,padre,g) es exacto dentro de la rama). */
  function topLinajes(n = 20) {
    if (!cacheTop) cacheTop = calcularTopLinajes();
    return cacheTop.slice(0, n);
  }

  function calcularTopLinajes() {
    const chars = characters.filter((c) => c.playable && c.active);
    const m = chars.length;
    const ids = chars.map((c) => c.char_id);

    const S = new Int32Array(m * m);
    for (let i = 0; i < m; i++)
      for (let j = i + 1; j < m; j++) S[i * m + j] = puntajePar(ids[i], ids[j]);

    const K = 300;
    let sets = [];
    for (let h = 0; h < m; h++)
      for (let p1 = h + 1; p1 < m; p1++)
        for (let p2 = p1 + 1; p2 < m; p2++) {
          const base = S[h * m + p1] + S[h * m + p2] + S[p1 * m + p2];
          if (sets.length < K || base > sets[sets.length - 1].base) {
            sets.push({ a: h, b: p1, c: p2, base });
            sets.sort((x, y) => y.base - x.base);
            if (sets.length > K) sets.length = K;
          }
        }

    const bonusCache = new Map();
    function mejorParAbuelos(h, p) {
      const key = h * m + p;
      let v = bonusCache.get(key);
      if (!v) {
        let t1 = -1, t2 = -1, g1 = -1, g2 = -1;
        for (let g = 0; g < m; g++) {
          /* Reglas del juego: nadie puede ser abuelo de su propia rama
             (g === p: prohibido), y el hijo sí puede ser abuelo pero esa
             relación se penaliza con afinidad 0 (corredora). */
          if (g === p) continue;
          const t = g === h ? 0 : puntajeTrioRapido(ids[h], ids[p], ids[g]);
          if (t > t1) {
            t2 = t1; g2 = g1; t1 = t; g1 = g;
          } else if (t > t2) {
            t2 = t; g2 = g;
          }
        }
        v = { g1, g2, puntos: t1 + t2 };
        bonusCache.set(key, v);
      }
      return v;
    }

    const candidatos = [];
    for (const s of sets)
      for (const [h, p1, p2] of [
        [s.a, s.b, s.c],
        [s.b, s.a, s.c],
        [s.c, s.a, s.b],
      ])
        candidatos.push({ h, p1, p2, base: s.base });

    const ranking = [];
    for (const c of candidatos) {
      const b1 = mejorParAbuelos(c.h, c.p1);
      const b2 = mejorParAbuelos(c.h, c.p2);
      ranking.push({ ...c, total: c.base + b1.puntos + b2.puntos, b1, b2 });
    }
    ranking.sort((a, b) => b.total - a.total);

    return ranking.map((r) => ({
      hijo: chars[r.h],
      padre: chars[r.p1],
      madre: chars[r.p2],
      abuelos: [
        [chars[r.b1.g1], chars[r.b1.g2]],
        [chars[r.b2.g1], chars[r.b2.g2]],
      ],
      puntos: r.total,
    }));
  }

  return {
    personajes: characters,
    porId,
    gruposCompartidos,
    puntajePar,
    puntajeTrio,
    rango,
    rangoTotal,
    topLinajes,
    gruposDeChar,
    todosLosGrupos,
    miembrosDeGrupo,
  };
}
