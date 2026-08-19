/**
 * Writes docs/sitemap.xml from the same route list the prerenderer builds from.
 *
 * There is no <lastmod>. A build stamp on every URL says only that the site was
 * rebuilt, which is not what the field means, and search engines learn to
 * ignore a sitemap that claims everything changed at once. Better to say
 * nothing than to say something untrue.
 *
 * robots.txt is not generated — it never varies, so it lives in public/.
 */

import { writeFile } from 'node:fs/promises'
import { loadPaths } from './build-routes.mjs'

const OUT = 'docs/sitemap.xml'

async function main() {
  const { SITEMAP_PATHS, SITE_URL } = await loadPaths()

  const urls = SITEMAP_PATHS.map(route => `  <url><loc>${SITE_URL}${route}</loc></url>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

  await writeFile(OUT, xml)
  console.log(`${OUT}  ${SITEMAP_PATHS.length} urls`)
}

main()
