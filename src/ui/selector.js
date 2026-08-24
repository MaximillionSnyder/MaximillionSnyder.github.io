import { contarSeleccionados, etiquetaRol, rolDeSlot } from '../herencia.js';

function colorDe(id) {
  return `hsl(${(id * 137.508) % 360} 55% 45%)`;
}

export function montarSelector(modelo, seleccion, quitarSlot) {
  const cont = document.querySelector('#selector');

  document.addEventListener('seleccion-cambio', render);
  render();

  function render() {
    for (const el of document.querySelectorAll('.js-contador')) {
      el.textContent = `(${contarSeleccionados(seleccion)}/7)`;
    }
    cont.replaceChildren();
    for (let i = 0; i < seleccion.length; i++) {
      const id = seleccion[i];
      if (id == null) continue;
      const c = modelo.porId.get(id);
      if (!c) continue;
      const iniciales = c.en_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `
        <span class="rol rol-${rolDeSlot(i)}">${etiquetaRol(i)}</span>
        <span class="avatar" style="background:${colorDe(id)}">${iniciales}</span>
        <span class="nombre">${c.en_name}</span>`;
      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'quitar';
      quitar.setAttribute('aria-label', `Quitar a ${c.en_name} de ${etiquetaRol(i)}`);
      quitar.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      quitar.addEventListener('click', () => quitarSlot(i));
      chip.append(quitar);
      cont.append(chip);
    }
    if (cont.children.length === 0) cont.innerHTML = '<p class="nota">Sin personajes seleccionados.</p>';
  }
}
