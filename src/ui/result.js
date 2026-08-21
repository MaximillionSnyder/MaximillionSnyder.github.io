export function montarResultado(modelo, seleccion) {
  const cont = document.querySelector('#resultado');

  document.addEventListener('seleccion-cambio', render);
  render();

  function filaPar(idA, idB) {
    const a = modelo.porId.get(idA);
    const b = modelo.porId.get(idB);
    const puntos = modelo.puntajePar(idA, idB);
    const rango = modelo.rango(puntos);
    const compartidos = modelo.gruposCompartidos([idA, idB]);
    const detalle = compartidos
      .slice(0, 6)
      .map((g) => `<li>#${g.tipo} · ${g.puntos}pt</li>`)
      .join('');
    const extra = compartidos.length > 6 ? `<li>+${compartidos.length - 6} más…</li>` : '';
    return `
      <div class="par">
        <div class="par-cabecera">
          <span>${a.en_name} × ${b.en_name}</span>
          <span class="puntos ${rango?.clase ?? ''}">${rango ? rango.simbolo + ' ' : ''}${puntos}</span>
        </div>
        ${compartidos.length ? `<ul class="detalle">${detalle}${extra}</ul>` : '<p class="nota">Sin grupos en común.</p>'}
      </div>`;
  }

  function paresDe(ids) {
    const filas = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) filas.push([ids[i], ids[j]]);
    }
    return filas;
  }

  function render() {
    cont.replaceChildren();
    if (seleccion.length < 2) {
      cont.innerHTML = '<p class="nota">Elegí al menos 2 personajes.</p>';
      return;
    }
    for (const [a, b] of paresDe(seleccion)) cont.innerHTML += filaPar(a, b);
    if (seleccion.length === 3) {
      const total = modelo.puntajeTrio(seleccion);
      cont.innerHTML += `
        <div class="trio">
          <span>Total trío</span>
          <span class="puntos">${total}</span>
        </div>
        <details class="compartido-trio">
          <summary>Grupos compartidos por los 3</summary>
          ${
            modelo.gruposCompartidos(seleccion).map((g) => `<span class="tag">#${g.tipo} · ${g.puntos}pt</span>`).join(' ') ||
            '<span class="nota">ninguno</span>'
          }
        </details>`;
    }
  }
}
