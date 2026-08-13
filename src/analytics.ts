/**
 * Google Analytics (GA4)
 * Base snippet and config run from index.html so the tag loads immediately.
 * We only send page views on each route change (SPA).
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const GOOGLE_ANALYTICS_ID = 'G-RGP6ZH42QM'

/** Send a page view (call on each router navigation; GA4 records it via config with page_path). */
export function trackPageView(path: string): void {
  if (typeof window.gtag !== 'function') {
    return
  }
  window.gtag('config', GOOGLE_ANALYTICS_ID, { page_path: path })
}
