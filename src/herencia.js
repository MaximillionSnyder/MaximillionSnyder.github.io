export const SLOTS = 7;

export function armarArbol(seleccion) {
  return {
    hijo: seleccion[0] ?? null,
    padres: [seleccion[1] ?? null, seleccion[2] ?? null],
    abuelosDe: [
      [seleccion[3] ?? null, seleccion[4] ?? null],
      [seleccion[5] ?? null, seleccion[6] ?? null],
    ],
  };
}

export function rolDeSlot(i) {
  if (i === 0) return 'hijo';
  if (i <= 2) return 'padre';
  return 'abuelo';
}

export function etiquetaRol(i) {
  if (i === 0) return 'Hijo';
  if (i === 1) return 'Padre 1';
  if (i === 2) return 'Padre 2';
  if (i === 3) return 'Abuelo 1 · Padre 1';
  if (i === 4) return 'Abuelo 2 · Padre 1';
  if (i === 5) return 'Abuelo 1 · Padre 2';
  return 'Abuelo 2 · Padre 2';
}

export function posicionesDe(seleccion, id) {
  const res = [];
  seleccion.forEach((s, i) => {
    if (s === id) res.push(i);
  });
  return res;
}

export function contarSeleccionados(seleccion) {
  return seleccion.filter(Boolean).length;
}

/* Regla del juego: el hijo no puede ser padre y los padres deben ser
   distintos entre sí. Hijo y abuelos no tienen restricciones. */
export function puedeIrEn(seleccion, slot, id) {
  if (slot < 0 || slot >= SLOTS || !id) return false;
  if (rolDeSlot(slot) !== 'padre') return true;
  for (let i = 1; i <= 2; i++) {
    if (i !== slot && seleccion[i] === id) return false;
    if (i === slot && seleccion[0] === id) return false;
  }
  return true;
}

/* Primer slot vacío donde el personaje sí pueda ir (saltea slots de padre
   si ya es el hijo o el otro padre). Devuelve -1 si no hay lugar. */
export function slotPara(seleccion, id) {
  const hayHueco = seleccion.some((s) => s == null);
  for (let i = 0; i < SLOTS; i++) {
    if (seleccion[i] == null && puedeIrEn(seleccion, i, id)) return i;
  }
  return hayHueco ? -2 : -1;
}

export function vinculos(arbol) {
  const v = [];
  const { hijo, padres, abuelosDe } = arbol;
  if (hijo != null) {
    for (const p of padres) {
      if (p != null) v.push({ tipo: 'hijo-padre', ids: [hijo, p] });
    }
  }
  if (padres[0] != null && padres[1] != null) v.push({ tipo: 'entre-padres', ids: [...padres] });
  /* Regla del juego: cada abuelo se vincula con el padre de su misma rama
     y el hijo a la vez (grupos comunes a los tres). Si el abuelo es la
     misma corredora, la relación vale 0. */
  if (hijo != null) {
    for (let p = 0; p < 2; p++) {
      if (padres[p] == null) continue;
      for (const a of abuelosDe[p]) {
        if (a != null)
          v.push({
            tipo: 'hijo-padre-abuelo',
            ids: [hijo, padres[p], a],
            esCorredora: a === hijo,
          });
      }
    }
  }
  return v;
}
