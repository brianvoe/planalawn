/**
 * Google Analytics (GA4)
 * Base snippet and config run from index.html so the tag loads immediately.
 * We only send page views on each route change (SPA).
 *
 * The dev server strips the tag, so window.gtag is undefined on localhost and
 * every call here turns into a no-op.
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

/** Must match the id configured in index.html, or route changes go nowhere. */
const GOOGLE_ANALYTICS_ID = 'G-28VS9N8XDM'

/** Send a page view (call on each router navigation; GA4 records it via config with page_path). */
export function trackPageView(path: string): void {
  if (typeof window.gtag !== 'function') {
    return
  }
  window.gtag('config', GOOGLE_ANALYTICS_ID, { page_path: path })
}
