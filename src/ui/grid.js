const normalize = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
import { etiquetaRol, posicionesDe } from '../herencia.js';

function colorDe(id) {
  return `hsl(${(id * 137.508) % 360} 55% 45%)`;
}

const ROL_CORTO = { Hijo: 'Hijo', 'Padre 1': 'Padre', 'Padre 2': 'Padre' };
const rolCorto = (et) => ROL_CORTO[et] ?? et.split(' ')[0];

export function montarGrid(modelo, seleccion, toggle) {
  const grid = document.querySelector('#grid');
  const buscador = document.querySelector('#buscador');
  let filtro = '';

  buscador.addEventListener('input', () => {
    filtro = normalize(buscador.value.trim());
    render();
  });
  document.addEventListener('seleccion-cambio', render);

  function coincide(c) {
    if (!filtro) return true;
    return (
      normalize(c.en_name).includes(filtro) ||
      c.jp_name.includes(filtro) ||
      c.url_name.includes(filtro)
    );
  }

  function crearCard(c) {
    const card = document.createElement('button');
    card.type = 'button';
    const roles = posicionesDe(seleccion, c.char_id).map((i) => rolCorto(etiquetaRol(i)));
    const unicos = [...new Set(roles)];
    card.className = 'card' + (roles.length ? ' seleccionada' : '');
    const iniciales = c.en_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
    card.innerHTML = `
      <span class="avatar" style="background:${colorDe(c.char_id)}">${iniciales}</span>
      <span class="nombre">${c.en_name}</span>
      <span class="jp">${c.jp_name}</span>
      ${unicos.length ? `<span class="roles">${unicos.map((r) => `<b>${r}</b>`).join('')}</span>` : ''}
      <span class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>`;
    card.addEventListener('click', () => toggle(c.char_id));
    return card;
  }

  function render() {
    grid.replaceChildren();
    for (const c of modelo.personajes) {
      if (!(c.playable && c.active)) continue;
      if (!coincide(c)) continue;
      grid.append(crearCard(c));
    }
    if (grid.children.length === 0) grid.innerHTML = '<p class="nota">Sin resultados.</p>';
  }

  render();
}
