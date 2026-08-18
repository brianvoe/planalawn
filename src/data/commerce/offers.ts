/**
 * Where to buy the products in the label catalog.
 *
 * Kept apart from products.ts on purpose. That file is hand-copied off labels
 * and changes only when a manufacturer reformulates; this one tracks listings,
 * which move constantly and will eventually be refreshed by a script. Mixing
 * the two would put machine-written rows next to numbers that must stay
 * hand-verified.
 *
 * Two shapes of listing:
 *
 * - 'product' points at one item by its ASIN or SKU. Best for the reader, and
 *   the only shape that can carry a pack size or a photo.
 * - 'search' hands the picking off to the retailer. Used where no listing has
 *   been verified yet, and for the pro chemicals that go in and out of stock
 *   under a dozen different seller names. An honest search beats a dead link
 *   to a listing that was there last year.
 *
 * URLs are stored untagged. The affiliate tag goes on at render time in
 * services/affiliate.ts, so it lives in one place and the URLs here stay
 * probeable by the link test.
 */

export type Retailer = 'amazon' | 'homeDepot' | 'lowes' | 'domyown' | 'siteOne'

export type OfferKind = 'product' | 'search'

export interface Offer {
  retailer: Retailer
  kind: OfferKind
  /** ASIN or retailer SKU. Product listings only — a search has no one item. */
  sku?: string
  /** Untagged. Do not bake a partner tag in here. */
  url: string
  /** Which pack this listing is, so it can be checked against the bag math. */
  packLb?: number
  packFlOz?: number
  /**
   * Only ever a URL served by the retailer. Amazon's terms require their
   * images come live from their own API, so a downloaded copy is not an
   * option — this stays empty until the Creators API is reachable.
   */
  imageUrl?: string
  note?: string
}

function amazonSearch(query: string, note?: string): Offer {
  return {
    retailer: 'amazon',
    kind: 'search',
    url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
    note,
  }
}

/**
 * Listings by product id, matching the ids in products.ts.
 *
 * Every entry is a search for now, because an ASIN cannot be guessed and a
 * wrong one is worse than no link at all — it sends a reader to the wrong bag
 * and earns nothing. Upgrading an entry is deliberately a hand job, once per
 * product, on the listing page itself:
 *
 * 1. Open the Amazon listing and confirm it is the analysis in products.ts —
 *    38-0-4 and 32-0-4 are different bags with different dial numbers.
 * 2. Take the ASIN out of the URL and set kind: 'product', sku: '<ASIN>',
 *    url: 'https://www.amazon.com/dp/<ASIN>'.
 * 3. Record packLb or packFlOz from the listing. The test checks it against
 *    the product's own bags[], which is what stops a 32 lb listing being
 *    pinned to a product whose bag math says 36 lb.
 *
 * Leave the search entry in place for anything not yet verified.
 */
export const offersByProduct: Record<string, Offer[]> = {
  // ── Broadleaf weeds, sprayed ───────────────────────────────────────────────
  'speedzone-lawn': [amazonSearch('SpeedZone Lawn Weed Killer PBI Gordon concentrate')],
  'speedzone-southern': [amazonSearch('SpeedZone Southern herbicide concentrate')],
  'weed-b-gon-crabgrass': [amazonSearch('Ortho Weed B-Gon Crabgrass Control concentrate')],
  'trimec-classic': [amazonSearch('Trimec Classic broadleaf herbicide concentrate')],
  'celsius-wg': [
    amazonSearch(
      'Celsius WG herbicide',
      'Sold in small jugs by weight — check you are getting the 10 oz bottle, not a sample.',
    ),
  ],

  // ── Grassy weeds, sprayed ──────────────────────────────────────────────────
  'quinclorac-75df': [amazonSearch('Quinclorac 75 DF crabgrass killer')],
  tenacity: [amazonSearch('Tenacity herbicide Syngenta mesotrione')],

  // ── Pre-emergent ───────────────────────────────────────────────────────────
  'prodiamine-65wdg': [amazonSearch('Prodiamine 65 WDG pre emergent herbicide')],
  'scotts-halts': [amazonSearch('Scotts Turf Builder Halts Crabgrass Preventer')],
  'prodiamine-038-granular': [amazonSearch('Prodiamine 0.38 granular pre emergent 0-0-7')],
  'lesco-dimension-015': [
    amazonSearch(
      'Dimension 0.15 granular pre emergent fertilizer',
      'A SiteOne counter product first — Amazon stock is resellers and comes and goes.',
    ),
  ],

  // ── Fertilizer and weed-and-feed ───────────────────────────────────────────
  'scotts-turf-builder-38-0-4': [amazonSearch('Scotts Turf Builder Lawn Food 38-0-4')],
  'scotts-turf-builder-32-0-4': [
    amazonSearch(
      'Scotts Turf Builder Lawn Food 32-0-4',
      'The older analysis. Check the bag in your hand before trusting a dial number.',
    ),
  ],
  milorganite: [amazonSearch('Milorganite 6-4-0 organic nitrogen fertilizer 32 lb')],
  'andersons-pgf-complete': [amazonSearch('The Andersons PGF Complete 16-4-8 fertilizer')],
  'scotts-starter': [amazonSearch('Scotts Turf Builder Starter Food for New Grass')],
  'scotts-starter-plus-weed-preventer': [
    amazonSearch('Scotts Turf Builder Starter Food Plus Weed Preventer'),
  ],
  'scotts-weed-and-feed': [amazonSearch('Scotts Turf Builder Weed and Feed')],
  'scotts-bonus-s': [amazonSearch('Scotts Turf Builder Bonus S Southern Weed and Feed')],

  // ── Insects and disease ────────────────────────────────────────────────────
  'scotts-grubex1': [amazonSearch('Scotts GrubEx1 Season Long Grub Killer')],
  'sevin-lawn-granules': [amazonSearch('Sevin Insect Killer Lawn Granules GardenTech')],
  'scotts-diseaseex': [amazonSearch('Scotts DiseaseEx Lawn Fungicide azoxystrobin')],
  'bifen-it': [amazonSearch('Bifen IT bifenthrin insecticide concentrate')],
  'propiconazole-143': [amazonSearch('Propiconazole 14.3 fungicide concentrate')],

  // ── Renovation ─────────────────────────────────────────────────────────────
  'glyphosate-41': [
    amazonSearch(
      'glyphosate 41 percent concentrate herbicide',
      'Percentages vary by jug and they mix differently — read the one you buy.',
    ),
  ],
}

export function offersFor(productId: string): Offer[] {
  return offersByProduct[productId] || []
}
