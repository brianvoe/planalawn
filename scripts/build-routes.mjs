/**
 * Reads the route list out of the app for the build scripts.
 *
 * src/router/paths.ts is TypeScript that imports JSON, so plain Node cannot
 * require it. Vite already knows how to load exactly that, and asking it beats
 * keeping a second copy of the list in a format Node can read — a duplicate
 * list is a list that goes stale.
 */

import { createServer } from 'vite'

export async function loadPaths() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })
  try {
    return await server.ssrLoadModule('/src/router/paths.ts')
  } finally {
    await server.close()
  }
}
