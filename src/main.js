import { cargarDatos } from './api.js';
import { crearModelo } from './affinity.js';
import { montarGrid } from './ui/grid.js';
import { montarSelector } from './ui/selector.js';
import { montarResultado } from './ui/result.js';
import { montarGrupos } from './ui/groups.js';

const MAX_SLOTS = 3;

const data = await cargarDatos();
const modelo = crearModelo(data);
const seleccion = [];

function toggle(id) {
  const idx = seleccion.indexOf(id);
  if (idx >= 0) seleccion.splice(idx, 1);
  else if (seleccion.length < MAX_SLOTS) seleccion.push(id);
  else return;
  document.dispatchEvent(new CustomEvent('seleccion-cambio'));
}

montarGrid(modelo, seleccion, toggle);
montarSelector(modelo, seleccion, toggle);
montarResultado(modelo, seleccion);
montarGrupos(modelo);

const tabCompat = document.querySelector('#tab-compat');
const tabGrupos = document.querySelector('#tab-grupos');
const vistaCompat = document.querySelector('#vista-compat');
const vistaGrupos = document.querySelector('#vista-grupos');

function activarTab(tab) {
  const compat = tab === 'compat';
  tabCompat.classList.toggle('activa', compat);
  tabGrupos.classList.toggle('activa', !compat);
  vistaCompat.classList.toggle('oculta', !compat);
  vistaGrupos.classList.toggle('oculta', compat);
}

tabCompat.addEventListener('click', () => activarTab('compat'));
tabGrupos.addEventListener('click', () => activarTab('grupos'));
