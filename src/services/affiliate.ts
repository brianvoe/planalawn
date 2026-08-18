import type { Offer, Retailer } from '../data/commerce/offers'

/**
 * Turning a stored listing URL into the link we actually render.
 *
 * The partner tag lives here and nowhere else. Filling one in switches on
 * three things together, which is the point: the tag on the URL, the "(paid
 * link)" marker beside it, and the disclosure in the footer. Until a tag is
 * set the links still work, they simply earn nothing and say nothing — so the
 * site never claims a commercial relationship it does not have.
 */
const PARTNER_TAGS: Partial<Record<Retailer, string>> = {
  // The Associates tracking ID for the amazon.com store. Public by nature —
  // it rides in every affiliate URL — so it belongs in the repo, not an env var.
  amazon: 'planalawn-20',
}

export const RETAILER_LABELS: Record<Retailer, string> = {
  amazon: 'Amazon',
  homeDepot: 'Home Depot',
  lowes: "Lowe's",
  domyown: 'DoMyOwn',
  siteOne: 'SiteOne',
}

/**
 * The sentence that has to sit beside a paid link, written once so the
 * calculator and the task pages cannot drift apart on what they promise.
 */
export const PAID_LINK_NOTE =
  'Buying through these earns this site a commission. It does not change which products ' +
  'are listed or the order they appear in — that follows the label rates and your calendar.'

/** Whether this retailer's program is live, i.e. whether its links earn. */
export function isPaidRetailer(retailer: Retailer): boolean {
  return Boolean(PARTNER_TAGS[retailer])
}

export function isPaidLink(offer: Offer): boolean {
  return isPaidRetailer(offer.retailer)
}

/**
 * The href for a listing, tagged if we are in that retailer's program.
 *
 * Built through URL rather than string concatenation because the two link
 * shapes differ: a product page carries no query string and a search already
 * has one.
 */
export function affiliateUrl(offer: Offer): string {
  const tag = PARTNER_TAGS[offer.retailer]
  if (!tag) return offer.url
  try {
    const url = new URL(offer.url)
    url.searchParams.set('tag', tag)
    return url.toString()
  } catch {
    return offer.url
  }
}

/**
 * What goes in rel. Paid links are marked sponsored so search engines can tell
 * them apart from the label and trial links, which are cited, not sold.
 */
export function linkRel(offer: Offer): string {
  return isPaidLink(offer) ? 'noopener noreferrer sponsored' : 'noopener noreferrer'
}
