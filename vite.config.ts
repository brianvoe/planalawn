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

export default defineConfig({
  base: '/',
  plugins: [vue(), githubPagesSpa()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    port: 5050,
    strictPort: true,
  },
})
