import { armarArbol, contarSeleccionados, vinculos } from '../herencia.js';

export function montarResultado(modelo, seleccion) {
  const cont = document.querySelector('#resultado');

  document.addEventListener('seleccion-cambio', render);
  render();

  const nombre = (id) => modelo.porId.get(id)?.en_name ?? id;

  function filaVinculo(v) {
    const nombres = v.ids.map((id) => nombre(id)).join(' × ');
    const puntos = puntosDe(v);
    const rango = modelo.rango(puntos);
    const compartidos = modelo.gruposCompartidos(v.ids);
    const detalle = compartidos
      .slice(0, 6)
      .map((g) => `<li>#${g.tipo} · ${g.puntos}pt</li>`)
      .join('');
    const extra = compartidos.length > 6 ? `<li>+${compartidos.length - 6} más…</li>` : '';
    return `
      <div class="par">
        <div class="par-cabecera">
          <span>${nombres}</span>
          <span class="puntos ${rango?.clase ?? ''}">${rango ? rango.simbolo + ' ' : ''}${puntos}</span>
        </div>
        ${v.esCorredora ? '<p class="nota">Afinidad 0 en el juego: es la misma que la corredora.</p>' : ''}
        ${compartidos.length ? `<ul class="detalle">${detalle}${extra}</ul>` : '<p class="nota">Sin grupos en común.</p>'}
      </div>`;
  }

  function puntosDe(v) {
    if (v.esCorredora) return 0;
    return v.ids.length === 3
      ? modelo.puntajeTrio(...v.ids)
      : modelo.puntajePar(v.ids[0], v.ids[1]);
  }

  /* Umbrales del juego sobre el total: ○ ≥ 51, ◎ ≥ 151, △ debajo. */
  function rangoTotal(total) {
    if (total >= 151) return { simbolo: '◎', clase: 'rank-great' };
    if (total >= 51) return { simbolo: '○', clase: 'rank-good' };
    return { simbolo: '△', clase: 'rank-fair' };
  }

  function filaEntrePadres(ids) {
    return filaVinculo({ ids, tipo: 'entre-padres' });
  }

  function render() {
    cont.replaceChildren();
    if (contarSeleccionados(seleccion) === 0) {
      cont.innerHTML = '<p class="nota">Elegí al hijo para empezar.</p>';
      return;
    }

    const arbol = armarArbol(seleccion);
    const vs = vinculos(arbol);
    const porTipo = (tipo) => vs.filter((v) => v.tipo === tipo);
    const total = vs.reduce((t, v) => t + puntosDe(v), 0);
    const rt = rangoTotal(total);

    let html = `
      <div class="trio">
        <span>Total herencia</span>
        <span class="puntos ${rt.clase}">${rt.simbolo} ${total}</span>
      </div>`;

    const hp = porTipo('hijo-padre').map(filaVinculo).join('');
    html += `<section class="vinculos"><h3>Hijo × Padres</h3>${
      hp ||
      (arbol.hijo == null
        ? '<p class="nota">Falta elegir al hijo.</p>'
        : '<p class="nota">Elegí al menos un padre.</p>')
    }</section>`;

    const ep = arbol.padres[0] != null && arbol.padres[1] != null;
    html += `<section class="vinculos"><h3>Entre padres</h3>${
      ep
        ? filaEntrePadres(arbol.padres)
        : '<p class="nota">' + (arbol.padres.some((p) => p != null) ? 'Elegí el otro padre.' : 'Faltan los padres.') + '</p>'
    }</section>`;

    const pa = porTipo('hijo-padre-abuelo').map(filaVinculo).join('');
    html += `<section class="vinculos"><h3>Hijo × Padres × Abuelos</h3>${
      arbol.hijo == null
        ? '<p class="nota">Falta elegir al hijo para calcular estas relaciones.</p>'
        : pa || '<p class="nota">Todavía no hay abuelos.</p>'
    }</section>`;

    if (!arbol.hijo && contarSeleccionados(seleccion) > 0) {
      html += '<p class="nota intro">Sin hijo no se calcula la herencia completa.</p>';
    }

    cont.innerHTML = html;
  }
}
