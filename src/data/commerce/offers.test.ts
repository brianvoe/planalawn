import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { offersByProduct } from './offers'
import { productById } from '../products'
import { affiliateUrl, isPaidLink, linkRel } from '../../services/affiliate'
import type { Offer } from './offers'

/**
 * Guard rails for the buy links.
 *
 * Two jobs. The first is the usual hand-entered-data check: a listing pinned
 * to a product that does not exist, a pack size that contradicts the bag math,
 * a tag accidentally baked into a stored URL.
 *
 * The second matters more. The site is sold on trial data rather than bag
 * marketing, so commerce must never reach the code that decides what to show
 * or in what order. That is asserted here rather than left to good intentions.
 */

const entries = Object.entries(offersByProduct)
const allOffers: { productId: string; offer: Offer }[] = entries.flatMap(([productId, offers]) =>
  offers.map((offer) => ({ productId, offer })),
)

describe('offer catalog', () => {
  it('has entries', () => {
    expect(allOffers.length).toBeGreaterThan(0)
  })

  it('only lists products that exist', () => {
    entries.forEach(([productId]) => {
      expect(productById[productId], `unknown product ${productId}`).toBeTruthy()
    })
  })

  it('never leaves a product keyed with nothing to click', () => {
    entries.forEach(([productId, offers]) => {
      expect(offers.length, `${productId} has an empty offer list`).toBeGreaterThan(0)
    })
  })

  allOffers.forEach(({ productId, offer }) => {
    describe(`${productId} → ${offer.retailer} ${offer.kind}`, () => {
      it('links over https', () => {
        expect(offer.url).toMatch(/^https:\/\//)
      })

      it('points at the retailer it claims', () => {
        if (offer.retailer !== 'amazon') return
        expect(new URL(offer.url).hostname).toMatch(/(^|\.)amazon\.com$/)
      })

      // The tag belongs in services/affiliate.ts, applied at render. A stored
      // one would fork the source of truth and quietly survive a tag change.
      it('stores the URL untagged', () => {
        expect(new URL(offer.url).searchParams.has('tag')).toBe(false)
      })

      it('carries a sku only where one item is meant', () => {
        if (offer.kind === 'product') {
          expect(offer.sku, 'a product listing needs its sku').toBeTruthy()
        } else {
          expect(offer.sku, 'a search is not one item').toBeUndefined()
          expect(offer.packLb, 'a search has no pack size').toBeUndefined()
          expect(offer.packFlOz, 'a search has no pack size').toBeUndefined()
        }
      })

      it('uses a canonical Amazon product URL', () => {
        if (offer.retailer !== 'amazon' || offer.kind !== 'product') return
        expect(offer.url).toMatch(/\/dp\/[A-Z0-9]{10}(\/|$)/)
        expect(offer.url).toContain(`/dp/${offer.sku}`)
      })

      // Catches a 32 lb listing pinned to a product whose bags are 36 lb,
      // which would make the "to buy" count on the calculator a lie.
      it('states a pack the product actually comes in', () => {
        const bags = productById[productId]?.bags
        if (offer.packLb == null || !bags?.length) return
        const sizes = bags.map((b) => b.lb)
        expect(sizes, `${offer.packLb} lb is not a listed bag`).toContain(offer.packLb)
      })

      it('is tagged exactly when it earns', () => {
        const href = new URL(affiliateUrl(offer))
        expect(href.searchParams.has('tag')).toBe(isPaidLink(offer))
      })

      it('keeps the rest of the URL intact when tagged', () => {
        const before = new URL(offer.url)
        const after = new URL(affiliateUrl(offer))
        expect(after.hostname).toBe(before.hostname)
        expect(after.pathname).toBe(before.pathname)
        before.searchParams.forEach((value, key) => {
          expect(after.searchParams.get(key)).toBe(value)
        })
      })

      it('marks a paid link sponsored and an unpaid one not', () => {
        expect(linkRel(offer).includes('sponsored')).toBe(isPaidLink(offer))
        expect(linkRel(offer)).toContain('noopener')
      })
    })
  })

  it('does not list the same URL twice for one product', () => {
    entries.forEach(([productId, offers]) => {
      const urls = offers.map((o) => o.url)
      expect(new Set(urls).size, `${productId} repeats a listing`).toBe(urls.length)
    })
  })

  it('has at most one search per retailer for a product', () => {
    entries.forEach(([productId, offers]) => {
      const searches = offers.filter((o) => o.kind === 'search').map((o) => o.retailer)
      expect(new Set(searches).size, `${productId} searches one retailer twice`).toBe(
        searches.length,
      )
    })
  })
})

/**
 * The modules that decide which products appear, and in what order. None of
 * them may read commerce data — if one ever does, a paid listing could move a
 * product up the page, which is the one thing this site cannot do.
 */
const RANKING_MODULES = [
  'src/data/products.ts',
  'src/services/apply.ts',
  'src/services/plan.ts',
  'src/services/suitability.ts',
  'src/services/timing.ts',
  'src/tasks/task-ui.ts',
]

describe('ranking neutrality', () => {
  RANKING_MODULES.forEach((relative) => {
    it(`${relative} does not read commerce data`, () => {
      const source = readFileSync(join(process.cwd(), relative), 'utf8')
      expect(source).not.toMatch(/data\/commerce/)
      expect(source).not.toMatch(/services\/affiliate/)
    })
  })
})
