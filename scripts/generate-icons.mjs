import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

const TABLA_CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ TABLA_CRC[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function trozo(tipo, datos) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([len, cuerpo, crc])
}

function png(ancho, alto, pixeles) {
  const firma = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0)
  ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const crudos = Buffer.alloc((ancho * 4 + 1) * alto)
  for (let y = 0; y < alto; y++) {
    const fila = y * (ancho * 4 + 1)
    crudos[fila] = 0
    pixeles.copy(crudos, fila + 1, y * ancho * 4, (y + 1) * ancho * 4)
  }
  return Buffer.concat([
    firma,
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(crudos)),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

const FONDO_SUP = [36, 40, 49]
const FONDO_INF = [18, 20, 24]
const ACENTO = [240, 140, 58]

function dentroCorazon(x, y) {
  const q = x * x + y * y - 1
  return q * q * q - x * x * y * y * y < 0
}

function limitesCorazon() {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let y = -2; y <= 2; y += 0.002) {
    for (let x = -2; x <= 2; x += 0.002) {
      if (dentroCorazon(x, y)) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, maxX, minY, maxY }
}

const LIMITES = limitesCorazon()

function dentroCajaRedondeada(px, py, centro, lado, radio) {
  const qx = Math.abs(px) - lado / 2 + radio
  const qy = Math.abs(py) - lado / 2 + radio
  const dx = Math.max(qx, 0)
  const dy = Math.max(qy, 0)
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(dx, dy) - radio < 0
}

function renderizar(tamano, { esquinasRedondeadas, escala }) {
  const muestreo = 4
  const paso = 1 / muestreo
  const centro = tamano / 2
  const anchoH = LIMITES.maxX - LIMITES.minX
  const altoH = LIMITES.maxY - LIMITES.minY
  const s = (tamano * escala) / Math.max(anchoH, altoH)
  const cx = centro - ((LIMITES.minX + LIMITES.maxX) / 2) * s
  const cy = centro - ((LIMITES.minY + LIMITES.maxY) / 2) * s
  const rgba = Buffer.alloc(tamano * tamano * 4)

  for (let py = 0; py < tamano; py++) {
    for (let px = 0; px < tamano; px++) {
      let fondo = 0
      let corazon = 0
      for (let sy = 0; sy < muestreo; sy++) {
        for (let sx = 0; sx < muestreo; sx++) {
          const X = px + (sx + 0.5) * paso
          const Y = py + (sy + 0.5) * paso
          const visible =
            !esquinasRedondeadas ||
            dentroCajaRedondeada(X - centro, Y - centro, centro, tamano, tamano * 0.16)
          if (!visible) continue
          fondo++
          const hx = (X - cx) / s
          const hy = -(Y - cy) / s
          if (dentroCorazon(hx, hy)) corazon++
        }
      }

      const t = py / tamano
      const base = [
        FONDO_SUP[0] + (FONDO_INF[0] - FONDO_SUP[0]) * t,
        FONDO_SUP[1] + (FONDO_INF[1] - FONDO_SUP[1]) * t,
        FONDO_SUP[2] + (FONDO_INF[2] - FONDO_SUP[2]) * t,
      ]
      const mezcla = fondo / (muestreo * muestreo)
      const pesoCorazon = corazon / (muestreo * muestreo)

      const r = base[0] + (ACENTO[0] - base[0]) * pesoCorazon
      const g = base[1] + (ACENTO[1] - base[1]) * pesoCorazon
      const b = base[2] + (ACENTO[2] - base[2]) * pesoCorazon

      const i = (py * tamano + px) * 4
      rgba[i] = Math.round(r)
      rgba[i + 1] = Math.round(g)
      rgba[i + 2] = Math.round(b)
      rgba[i + 3] = Math.round(mezcla * 255)
    }
  }
  return png(tamano, tamano, rgba)
}

const publico = join(raiz, 'public')
mkdirSync(join(publico, 'icons'), { recursive: true })

const salidas = [
  ['icons/pwa-192.png', 192, { esquinasRedondeadas: true, escala: 0.56 }],
  ['icons/pwa-512.png', 512, { esquinasRedondeadas: true, escala: 0.56 }],
  ['icons/maskable-192.png', 192, { esquinasRedondeadas: false, escala: 0.44 }],
  ['icons/maskable-512.png', 512, { esquinasRedondeadas: false, escala: 0.44 }],
  ['apple-touch-icon.png', 180, { esquinasRedondeadas: false, escala: 0.58 }],
]

for (const [ruta, tamano, opciones] of salidas) {
  writeFileSync(join(publico, ruta), renderizar(tamano, opciones))
  console.log(`ok ${ruta} (${tamano}x${tamano})`)
}
