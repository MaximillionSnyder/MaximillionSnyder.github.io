export async function cargarDatos() {
  const [characters, relations, members] = await Promise.all([
    fetch('./data/characters.json').then((r) => {
      if (!r.ok) throw new Error(`characters.json HTTP ${r.status}`);
      return r.json();
    }),
    fetch('./data/succession_relation.json').then((r) => {
      if (!r.ok) throw new Error(`succession_relation.json HTTP ${r.status}`);
      return r.json();
    }),
    fetch('./data/succession_relation_member.json').then((r) => {
      if (!r.ok) throw new Error(`succession_relation_member.json HTTP ${r.status}`);
      return r.json();
    }),
  ]);
  return { characters, relations, members };
}
