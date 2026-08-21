function colorDe(id) {
  return `hsl(${(id * 137.508) % 360} 55% 45%)`;
}

export function montarSelector(modelo, seleccion, toggle) {
  const cont = document.querySelector('#selector');
  const contador = document.querySelector('#contador');

  document.addEventListener('seleccion-cambio', render);
  render();

  function render() {
    contador.textContent = `(${seleccion.length}/3)`;
    cont.replaceChildren();
    if (seleccion.length === 0) {
      cont.innerHTML = '<p class="nota">Tocá personajes de la grilla para comparar (hasta 3).</p>';
      return;
    }
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
      quitar.textContent = '✕';
      quitar.setAttribute('aria-label', `Quitar ${c.en_name}`);
      quitar.addEventListener('click', () => toggle(id));
      chip.append(quitar);
      cont.append(chip);
    }
  }
}
