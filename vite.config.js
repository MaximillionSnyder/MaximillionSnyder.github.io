import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { defineConfig } from 'vite'

function copiarDatos() {
  return {
    name: 'copiar-datos',
    apply: 'build',
    generateBundle() {
      for (const archivo of readdirSync('data')) {
        if (!archivo.endsWith('.json')) continue
        this.emitFile({
          type: 'asset',
          fileName: `data/${archivo}`,
          source: readFileSync(`data/${archivo}`),
        })
      }
    },
  }
}

const PLANTILLA_SW = `
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const CACHE = 'afinidad-' + VERSION

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const clave of await caches.keys()) {
        if (clave !== CACHE) await caches.delete(clave)
      }
      await self.clients.claim()
    })(),
  )
})

async function revalidar(request, cache) {
  try {
    const respuesta = await fetch(request)
    if (respuesta && respuesta.ok) await cache.put(request, respuesta.clone())
    return respuesta
  } catch {
    return null
  }
}

self.addEventListener('fetch', (evento) => {
  const request = evento.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  if (request.mode === 'navigate') {
    const indice = new URL('./index.html', self.registration.scope).href
    evento.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        try {
          const respuesta = await fetch(request)
          if (respuesta.ok) await cache.put(indice, respuesta.clone())
          return respuesta
        } catch {
          return (await cache.match(indice)) || Response.error()
        }
      })(),
    )
    return
  }

  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cacheado = await cache.match(request)
      const red = revalidar(request, cache)
      if (cacheado) {
        evento.waitUntil(red)
        return cacheado
      }
      return (await red) || Response.error()
    })(),
  )
})
`

function serviceWorkerPlugin() {
  return {
    name: 'generar-sw',
    apply: 'build',
    closeBundle() {
      const archivos = []
      const visitar = (dir) => {
        for (const entrada of readdirSync(dir, { withFileTypes: true })) {
          const ruta = join(dir, entrada.name)
          if (entrada.isDirectory()) visitar(ruta)
          else archivos.push(ruta)
        }
      }
      visitar('dist')

      const relativos = archivos
        .map((p) => p.split(sep).slice(1).join('/'))
        .filter((p) => !p.startsWith('.') && p !== 'sw.js')
        .sort()

      const hash = createHash('sha256')
      for (const relativo of relativos) {
        hash.update(relativo)
        hash.update(String(statSync(join('dist', relativo)).size))
      }

      const fuente = PLANTILLA_SW.replace('__VERSION__', hash.digest('hex').slice(0, 12)).replace(
        '__PRECACHE__',
        JSON.stringify(relativos),
      )
      writeFileSync(join('dist', 'sw.js'), fuente.trimStart())
    },
  }
}

export default defineConfig({
  base: '/afinidad/',
  plugins: [copiarDatos(), serviceWorkerPlugin()],
})
