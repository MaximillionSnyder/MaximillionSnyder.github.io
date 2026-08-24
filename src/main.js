import { cargarDatos } from './api.js';
import { crearModelo } from './affinity.js';
import { SLOTS, contarSeleccionados, posicionesDe, slotPara } from './herencia.js';
import { montarGrid } from './ui/grid.js';
import { montarSelector } from './ui/selector.js';
import { montarResultado } from './ui/result.js';
import { montarGrupos } from './ui/groups.js';

const MQ_DESKTOP = '(min-width: 840px)';

const data = await cargarDatos();
const modelo = crearModelo(data);
const seleccion = new Array(SLOTS).fill(null);

function toggle(id) {
  const pos = posicionesDe(seleccion, id);
  if (pos.length > 0) {
    quitarSlot(pos[pos.length - 1]);
    return;
  }
  const slot = slotPara(seleccion, id);
  if (slot >= 0) {
    seleccion[slot] = id;
    document.dispatchEvent(new CustomEvent('seleccion-cambio'));
  } else {
    avisar(slot === -1 ? 'Selección completa (7/7)' : 'El hijo no puede ser padre ni repetirse un padre');
  }
}

function quitarSlot(i) {
  if (seleccion[i] == null) return;
  if (i === 0 && seleccion.some((s, j) => j > 0 && s != null)) {
    abrirModalQuitarHijo();
    return;
  }
  seleccion[i] = null;
  document.dispatchEvent(new CustomEvent('seleccion-cambio'));
}

montarGrid(modelo, seleccion, toggle);
montarSelector(modelo, seleccion, quitarSlot);
montarResultado(modelo, seleccion);
montarGrupos(modelo);

/* ---------- Bottom sheet ---------- */

const sheet = document.querySelector('#sheet');
const scrim = document.querySelector('#scrim');
const agarre = document.querySelector('#sheet-agarre');
let sheetAbierto = false;

function abrirSheet() {
  if (mqDesktop.matches || sheetAbierto) return;
  sheetAbierto = true;
  scrim.classList.remove('oculta');
  requestAnimationFrame(() => sheet.classList.add('abierta'));
  document.documentElement.classList.add('sin-scroll');
}

function cerrarSheet() {
  if (!sheetAbierto) return;
  sheetAbierto = false;
  sheet.classList.remove('abierta');
  sheet.style.transform = '';
  scrim.classList.add('oculta');
  document.documentElement.classList.remove('sin-scroll');
}

document.querySelector('#ver-afinidad').addEventListener('click', abrirSheet);
scrim.addEventListener('click', () => {
  cerrarSheet();
  cerrarModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarSheet();
    cerrarModal();
  }
});

agarre.addEventListener('pointerdown', iniciarArrastre);

function iniciarArrastre(e) {
  e.preventDefault();
  agarre.setPointerCapture(e.pointerId);
  const y0 = e.clientY;
  let dy = 0;

  const mover = (ev) => {
    dy = Math.max(0, ev.clientY - y0);
    sheet.classList.add('arrastrando');
    sheet.style.transform = `translateY(${dy}px)`;
  };

  const soltar = () => {
    agarre.removeEventListener('pointermove', mover);
    agarre.removeEventListener('pointerup', soltar);
    agarre.removeEventListener('pointercancel', soltar);
    sheet.classList.remove('arrastrando');
    if (dy > 110) cerrarSheet();
    else sheet.style.transform = '';
  };

  agarre.addEventListener('pointermove', mover);
  agarre.addEventListener('pointerup', soltar);
  agarre.addEventListener('pointercancel', soltar);
}

/* ---------- Modal: quitar hijo ---------- */

const modal = document.querySelector('#modal-quitar');

function abrirModalQuitarHijo() {
  modal.classList.remove('oculta');
  scrim.classList.remove('oculta');
}

function cerrarModal() {
  modal.classList.add('oculta');
  if (!sheetAbierto) scrim.classList.add('oculta');
}

document.querySelector('#modal-solo-hijo').addEventListener('click', () => {
  seleccion[0] = null;
  cerrarModal();
  document.dispatchEvent(new CustomEvent('seleccion-cambio'));
});

document.querySelector('#modal-limpiar').addEventListener('click', () => {
  seleccion.fill(null);
  cerrarModal();
  document.dispatchEvent(new CustomEvent('seleccion-cambio'));
});

document.querySelector('#modal-cancelar').addEventListener('click', cerrarModal);

/* ---------- Toast ---------- */

const toast = document.querySelector('#toast');
let toastTimer;

function avisar(msg) {
  toast.textContent = msg;
  toast.classList.remove('oculta');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('oculta'), 2400);
}

/* ---------- Navegación (tabs desktop + bottom nav móvil) ---------- */

const paresTab = [
  ['compat', document.querySelector('#tab-compat'), document.querySelector('#nav-compat')],
  ['grupos', document.querySelector('#tab-grupos'), document.querySelector('#nav-grupos')],
];
const vistas = {
  compat: document.querySelector('#vista-compat'),
  grupos: document.querySelector('#vista-grupos'),
};

function activarTab(tab) {
  for (const [clave, tabBtn, navBtn] of paresTab) {
    const activa = clave === tab;
    tabBtn.classList.toggle('activa', activa);
    navBtn.classList.toggle('activa', activa);
    if (activa) navBtn.setAttribute('aria-current', 'page');
    else navBtn.removeAttribute('aria-current');
    vistas[clave].classList.toggle('oculta', !activa);
  }
  window.scrollTo({ top: 0 });
}

for (const [clave, tabBtn, navBtn] of paresTab) {
  tabBtn.addEventListener('click', () => activarTab(clave));
  navBtn.addEventListener('click', () => activarTab(clave));
}

/* ---------- Reubicación responsive de selector y resultado ---------- */

const selectorEl = document.querySelector('#selector');
const resultadoEl = document.querySelector('#resultado');
const slotSelectorPanel = document.querySelector('#slot-selector-panel');
const slotResultadoPanel = document.querySelector('#slot-resultado-panel');

const mqDesktop = matchMedia(MQ_DESKTOP);

function reubicar() {
  if (mqDesktop.matches) {
    slotSelectorPanel.append(selectorEl);
    slotResultadoPanel.append(resultadoEl);
    cerrarSheet();
  } else {
    document.querySelector('.sheet-cuerpo').append(resultadoEl);
  }
}
mqDesktop.addEventListener('change', reubicar);
reubicar();

/* ---------- Barra de selección flotante ---------- */

const barra = document.querySelector('#barra-seleccion');

function refrescarBarra() {
  barra.classList.toggle('oculta', contarSeleccionados(seleccion) === 0 || mqDesktop.matches);
}
document.addEventListener('seleccion-cambio', refrescarBarra);
refrescarBarra();
