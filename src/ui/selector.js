function colorDe(id) {
  return `hsl(${(id * 137.508) % 360} 55% 45%)`;
}

export function montarSelector(modelo, seleccion, toggle) {
  const cont = document.querySelector('#selector');

  document.addEventListener('seleccion-cambio', render);
  render();

  function render() {
    for (const el of document.querySelectorAll('.js-contador')) {
      el.textContent = `(${seleccion.length}/3)`;
    }
    cont.replaceChildren();
    if (seleccion.length === 0) return;
    for (const id of seleccion) {
      const c = modelo.porId.get(id);
      const iniciales = c.en_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `
        <span class="avatar" style="background:${colorDe(id)}">${iniciales}</span>
        <span class="nombre">${c.en_name}</span>`;
      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'quitar';
      quitar.setAttribute('aria-label', `Quitar ${c.en_name}`);
      quitar.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      quitar.addEventListener('click', () => toggle(id));
      chip.append(quitar);
      cont.append(chip);
    }
  }
}
