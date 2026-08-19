/**
 * Turns the built SPA into one real HTML file per route.
 *
 * Runs after `vite build`, as part of `npm run build`. It serves docs/, opens
 * each route in headless Chromium, waits for the app to render, and writes the
 * resulting markup back over docs/. Visitors and crawlers then get finished
 * HTML on the first byte instead of an empty <div id="app">.
 *
 * A browser does the rendering rather than Node because the store reads
 * localStorage the moment it is imported, which has no meaning outside a
 * browser. Running the real thing sidesteps that entirely, at the cost of a
 * slower build.
 *
 * What lands in the file is the logged-out, no-location view: fresh browser,
 * empty localStorage. That is the right thing to publish — it is what a first
 * visitor and a crawler should see — and the moment the app boots it swaps in
 * whatever that particular browser has saved.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { preview } from 'vite'
import { loadPaths } from './build-routes.mjs'

const OUT = 'docs'

/**
 * Third parties are cut off for the render.
 *
 * Analytics is the one that matters: without this, every build fires a page
 * view for all sixty-odd routes and the reports fill up with traffic nobody
 * made. The fonts are blocked only because waiting on them is time spent for
 * markup that does not change.
 */
const BLOCKED = [
  'googletagmanager.com',
  'google-analytics.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'api.open-meteo.com',
]

/**
 * `/tasks/mowing` is written as tasks/mowing.html, not tasks/mowing/index.html.
 *
 * GitHub Pages serves a flat file at the extensionless URL directly, while a
 * directory always 301s to add a trailing slash. Since the router, the internal
 * links and the canonical tags all use the slash-less form, the directory
 * layout would make every crawl of an internal link a redirect to a URL that
 * then claims a different canonical. Flat files keep one address per page.
 */
function fileFor(route) {
  return path.join(OUT, route === '/' ? 'index.html' : `${route}.html`)
}

async function main() {
  const { PRERENDER_PATHS } = await loadPaths()

  const server = await preview({
    build: { outDir: OUT },
    preview: { port: 4180, strictPort: true },
    logLevel: 'error',
  })
  const origin = server.resolvedUrls.local[0].replace(/\/$/, '')

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.route('**/*', route => {
    const url = route.request().url()
    return BLOCKED.some(host => url.includes(host)) ? route.abort() : route.continue()
  })

  const failures = []

  // Captured first and written afterwards. The preview server is serving the
  // same directory we are about to write into, so flushing as we go would mean
  // later routes booting from an already-prerendered page instead of the shell.
  const captured = new Map()

  for (const route of PRERENDER_PATHS) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' })

    // The router mounts the page component asynchronously now that routes are
    // split, so a loaded document is not yet a rendered one.
    await page.waitForFunction(() => {
      const app = document.getElementById('app')
      return Boolean(app && app.childElementCount > 0)
    })

    const status = response?.status() ?? 0
    const title = await page.title()
    if (status !== 200 || !title) {
      failures.push(`${route} (status ${status}, title ${JSON.stringify(title)})`)
      continue
    }

    const html = await page.content()
    captured.set(route, html)
    console.log(`${route.padEnd(34)} ${String(Math.round(html.length / 1024)).padStart(4)} KB  ${title}`)
  }

  await browser.close()
  await server.close()

  if (failures.length) {
    console.error(`\nprerender failed on ${failures.length} route(s):`)
    failures.forEach(f => console.error(`  ${f}`))
    process.exit(1)
  }

  for (const [route, html] of captured) {
    const file = fileFor(route)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, html)
  }

  console.log(`\nprerendered ${captured.size} routes into ${OUT}/`)
}

main()
