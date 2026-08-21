export function montarGrupos(modelo) {
  const cont = document.querySelector('#grupos');
  const selectMin = document.querySelector('#min-puntos');

  selectMin.addEventListener('change', render);

  function render() {
    const min = Number(selectMin.value);
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
