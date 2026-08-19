/**
 * Every URL with a stable, shareable address.
 *
 * The build reads this twice: once to decide what to prerender into real HTML
 * files, and once to write the sitemap. Keeping both off the same list is the
 * point — a page that gets prerendered but never listed is invisible, and one
 * that gets listed but never built is a 404 in Search Console.
 *
 * Deliberately absent are the URLs that cannot be built ahead of time: the
 * `user-` blends, which exist only in the browser of whoever typed in their bag
 * tag, and anything driven by a query string. Those still work; they just fall
 * back to the SPA shell in 404.html.
 *
 * Only plain data is imported here, because the build loads this file in Node
 * where there is no DOM.
 */

import { tasks } from '../data/tasks'
import { curatedBlendList } from '../data/blends/curated'

/** Absolute, because canonical, og:url and the sitemap are all meaningless as relative paths. */
export const SITE_URL = 'https://planalawn.com'

const STATIC_PAGES = [
  '/',
  '/calendar',
  '/tasks',
  '/seeds',
  '/seeds/blends',
  '/seeds/cultivars',
  '/seeds/compare',
  '/seeds/ntep',
  '/calculate',
]

/** Worth building for the instant paint, but nothing a search engine wants. */
const UNLISTED_PAGES = ['/settings']

const CONTENT_PAGES = [
  ...STATIC_PAGES,
  ...tasks.map(task => `/tasks/${task.id}`),
  ...curatedBlendList.map(blend => `/seeds/blends/${blend.id}`),
]

export const PRERENDER_PATHS: string[] = [...CONTENT_PAGES, ...UNLISTED_PAGES]

export const SITEMAP_PATHS: string[] = CONTENT_PAGES
