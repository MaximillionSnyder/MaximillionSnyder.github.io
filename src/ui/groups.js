const OPCIONES = [0, 2, 5, 7, 8];

export function montarGrupos(modelo) {
  const cont = document.querySelector('#grupos');
  const filtro = document.querySelector('#filtro-puntos');
  let min = 0;

  for (const valor of OPCIONES) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-filtro' + (valor === min ? ' activa' : '');
    chip.textContent = valor === 0 ? 'Todos' : `${valor}+ pt`;
    chip.setAttribute('aria-pressed', String(valor === min));
    chip.addEventListener('click', () => {
      min = valor;
      for (const c of filtro.children) {
        const activo = Number(c.dataset.valor) === min;
        c.classList.toggle('activa', activo);
        c.setAttribute('aria-pressed', String(activo));
      }
      render();
    });
    chip.dataset.valor = String(valor);
    filtro.append(chip);
  }

  function render() {
    cont.replaceChildren();
    for (const g of modelo.todosLosGrupos()) {
      if (g.puntos < min) continue;
      const item = document.createElement('details');
      item.className = 'grupo';
      const miembros = modelo.miembrosDeGrupo(g.tipo).map((c) => c.en_name);
      item.innerHTML = `
        <summary><span class="tag">#${g.tipo}</span> <strong>${g.puntos}pt</strong> <span class="cantidad">${miembros.length} miembros</span></summary>
        <p class="miembros">${miembros.join(' · ')}</p>`;
      cont.append(item);
    }
    if (cont.children.length === 0) cont.innerHTML = '<p class="nota">Sin grupos con esos puntos.</p>';
  }

  render();
}
