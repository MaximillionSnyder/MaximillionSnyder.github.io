const OPCIONES = [0, 2, 5, 7, 8];

export function montarGrupos(modelo, verHerencia) {
  const cont = document.querySelector('#grupos');
  const filtro = document.querySelector('#filtro-puntos');
  let min = 0;

  montarTop(modelo, verHerencia);

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

function montarTop(modelo, verHerencia) {
  const lista = document.querySelector('#top-linajes');
  lista.innerHTML = '<li class="nota">Calculando…</li>';

  /* Diferido: el primer cálculo tarda ~1 s y no debe bloquear el render. */
  setTimeout(() => {
    const top = modelo.topLinajes(20);
    lista.replaceChildren();
    top.forEach((combo, i) => {
      const r = modelo.rangoTotal(combo.puntos);
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="pos">${i + 1}</span>
        <span class="nombres">${combo.hijo.en_name} × ${combo.padre.en_name} × ${combo.madre.en_name}</span>
        <span class="puntos ${r.clase}">${r.simbolo} ${combo.puntos}</span>
        <button type="button" class="btn-filled">Ver herencia</button>`;
      li.querySelector('button').addEventListener('click', () => verHerencia(combo));
      lista.append(li);
    });
    if (lista.children.length === 0) lista.innerHTML = '<li class="nota">Sin datos.</li>';
  }, 0);
}
