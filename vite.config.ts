import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/** GitHub Pages has no SPA rewrite — unknown paths serve 404.html. */
function githubPagesSpa(): Plugin {
  let outDir = 'docs'
  return {
    name: 'github-pages-spa',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const index = path.resolve(outDir, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.resolve(outDir, '404.html'))
      }
    },
  }
}

/**
 * Keep GA4 out of the dev server, so local page views never land in the
 * property and the tag cannot interfere with debugging.
 *
 * The tag lives in index.html rather than here to stay discoverable, which
 * means this strip silently stops working if those markers are ever renamed.
 * Checking for the loader afterwards turns that into a startup error instead
 * of months of localhost traffic in the reports.
 */
function analyticsProductionOnly(): Plugin {
  return {
    name: 'analytics-production-only',
    apply: 'serve',
    transformIndexHtml(html) {
      const stripped = html.replace(
        /[ \t]*<!-- analytics:start -->[\s\S]*?<!-- analytics:end -->\n?/g,
        '',
      )
      if (stripped.includes('googletagmanager')) {
        throw new Error(
          'analytics-production-only: found a Google Analytics tag in index.html ' +
            'that is not wrapped in <!-- analytics:start --> / <!-- analytics:end -->, ' +
            'so it would load on localhost. Wrap it or remove it.',
        )
      }
      return stripped
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [vue(), githubPagesSpa(), analyticsProductionOnly()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    port: 5050,
    strictPort: true,
  },
})
