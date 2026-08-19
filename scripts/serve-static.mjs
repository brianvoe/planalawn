/**
 * Serves docs/ the way GitHub Pages does. Run `npm run preview:static`.
 *
 * `vite preview` rewrites every unmatched path to index.html, which means a
 * broken deep link looks fine locally and 404s in production. This resolves
 * requests the way Pages actually does — exact file, then `<path>.html`, then
 * 404.html with a 404 status — so what you see here is what gets served.
 */

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

const ROOT = path.resolve('docs')
const PORT = Number(process.env.PORT || 4200)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
}

async function resolve(pathname) {
  // Pages serves a directory's index.html, a bare name from `<name>.html`, and
  // falls back to 404.html. Anything escaping the root is simply not found.
  const target = path.join(ROOT, decodeURIComponent(pathname))
  if (!target.startsWith(ROOT)) {
    return null
  }

  const candidates = pathname.endsWith('/')
    ? [path.join(target, 'index.html')]
    : [target, `${target}.html`, path.join(target, 'index.html')]

  for (const candidate of candidates) {
    const info = await stat(candidate).catch(() => null)
    if (info?.isFile()) {
      return candidate
    }
  }
  return null
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  const file = (await resolve(pathname)) ?? path.join(ROOT, '404.html')
  const found = Boolean(await resolve(pathname))

  res.writeHead(found ? 200 : 404, {
    'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
  })
  createReadStream(file).pipe(res)
})

server.listen(PORT, () => {
  console.log(`docs/ served like GitHub Pages on http://localhost:${PORT}/`)
})
