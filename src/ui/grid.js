const normalize = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function colorDe(id) {
  return `hsl(${(id * 137.508) % 360} 55% 45%)`;
}

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
    card.className = 'card' + (seleccion.includes(c.char_id) ? ' seleccionada' : '');
    const iniciales = c.en_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
    card.innerHTML = `
      <span class="avatar" style="background:${colorDe(c.char_id)}">${iniciales}</span>
      <span class="nombre">${c.en_name}</span>
      <span class="jp">${c.jp_name}</span>`;
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
