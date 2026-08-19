/**
 * Writes the current page's metadata into <head>.
 *
 * Hand-rolled rather than a head library because the requirement is small and
 * fixed: one title, one description, one canonical, three Open Graph tags. The
 * build-time prerenderer reads the DOM after the app has rendered, so there is
 * nothing here that needs to work server-side.
 *
 * Tags are reused where they already exist — index.html ships defaults so the
 * markup is correct before any JavaScript runs — and updated in place rather
 * than removed and re-added, which keeps the head stable across navigations.
 */

import type { PageMeta } from './meta'
import { SITE_URL } from './paths'

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  selector: string,
  init: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] {
  const existing = document.head.querySelector<HTMLElementTagNameMap[K]>(selector)
  if (existing) {
    return existing
  }
  const created = document.createElement(tag)
  init(created)
  document.head.appendChild(created)
  return created
}

function meta(attr: 'name' | 'property', key: string, content: string): void {
  element('meta', `meta[${attr}="${key}"]`, el => el.setAttribute(attr, key)).content = content
}

export function applyPageMeta(page: PageMeta, path: string): void {
  const url = `${SITE_URL}${path}`

  document.title = page.title
  meta('name', 'description', page.description)
  meta('property', 'og:title', page.title)
  meta('property', 'og:description', page.description)
  meta('property', 'og:url', url)

  element('link', 'link[rel="canonical"]', el => (el.rel = 'canonical')).href = url

  // Left in place rather than deleted when a page is indexable: an empty robots
  // tag says nothing, and removing it would mean re-adding it on the way back.
  meta('name', 'robots', page.noindex ? 'noindex, follow' : 'index, follow')
}

const SCHEMA_SELECTOR = 'script[type="application/ld+json"]'

/**
 * Unlike the meta tags, this one is removed when a page has nothing to say.
 * An empty or stale ld+json block is a parse error to anything reading it,
 * so leaving the tag behind to be refilled later is not an option here.
 */
export function applyPageSchema(nodes: Record<string, unknown>[]): void {
  if (!nodes.length) {
    document.head.querySelector(SCHEMA_SELECTOR)?.remove()
    return
  }

  const script = element(
    'script',
    SCHEMA_SELECTOR,
    el => (el.type = 'application/ld+json'),
  )
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes })
}
