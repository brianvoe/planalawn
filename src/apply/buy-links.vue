<script lang="ts">
import { offersFor } from '../data/commerce/offers'
import {
  PAID_LINK_NOTE,
  RETAILER_LABELS,
  affiliateUrl,
  isPaidLink,
  linkRel,
} from '../services/affiliate'
import type { Offer } from '../data/commerce/offers'

/**
 * Where to buy one product.
 *
 * Deliberately dumb: it reads listings and renders them, and has no say in
 * which products appear or in what order. That stays with the label rates and
 * the calendar, so a paid link can never move a product up a page.
 *
 * A listing we have verified says "Buy"; one that hands off to the retailer's
 * own search says "Find". The distinction is worth the words — a search result
 * is a weaker promise, and pretending otherwise wastes a reader's click.
 */
export default {
  name: 'BuyLinks',
  props: {
    productId: { type: String, required: true },
    /** Drops the heading and the note, for lists that carry their own. */
    compact: { type: Boolean, default: false },
  },
  data() {
    return { paidNote: PAID_LINK_NOTE }
  },
  computed: {
    offers(): Offer[] {
      return offersFor(this.productId)
    },
    /** Only worth saying once, and only where something is actually paid. */
    showNote(): boolean {
      return !this.compact && this.offers.some(isPaidLink)
    },
  },
  methods: {
    affiliateUrl,
    isPaidLink,
    linkRel,
    label(offer: Offer): string {
      const verb = offer.kind === 'product' ? 'Buy' : 'Find'
      return `${verb} on ${RETAILER_LABELS[offer.retailer]}`
    },
  },
}
</script>

<style lang="scss">
.buy-links {
  margin-top: 1rem;

  /* Inside a list of products the block is one row among many, so the pill
     shrinks and the per-listing hint gives way to the product's own notes on
     the calculator page. */
  &--compact {
    margin-top: 0;

    .buy-links__link {
      padding: 0.3rem 0.7rem;
      font-size: 0.8rem;
    }

    .buy-links__hint {
      display: none;
    }
  }

  .buy-links__label {
    margin: 0 0 0.45rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .buy-links__list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .buy-links__item {
    display: grid;
    justify-items: start;
    gap: 0.2rem;
    max-width: 22rem;
  }

  .buy-links__link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;

    &:hover {
      color: var(--color-primary-strong);
      border-color: var(--color-primary);
    }
  }

  /* Reserved so a photo can drop in later without the row jumping. Amazon's
     terms require their images be served live from their own API, so this
     stays empty until that access exists. */
  .buy-links__thumb {
    flex-shrink: 0;
    width: 2.2rem;
    aspect-ratio: 1;
    object-fit: contain;
    background: var(--color-surface-alt);
    border-radius: var(--border-radius);
  }

  .buy-links__paid {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .buy-links__pack {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .buy-links__hint,
  .buy-links__note {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  /* Above the links, not below: a disclosure a reader meets after clicking
     has done nothing. */
  .buy-links__note {
    margin-bottom: 0.5rem;
  }
}
</style>

<template>
  <div v-if="offers.length" class="buy-links" :class="{ 'buy-links--compact': compact }">
    <p v-if="!compact" class="buy-links__label">Where to buy</p>
    <p v-if="showNote" class="buy-links__note">{{ paidNote }}</p>

    <ul class="buy-links__list">
      <li v-for="offer in offers" :key="`${offer.retailer}-${offer.url}`" class="buy-links__item">
        <a
          class="buy-links__link"
          :href="affiliateUrl(offer)"
          target="_blank"
          :rel="linkRel(offer)"
        >
          <img
            v-if="offer.imageUrl"
            class="buy-links__thumb"
            :src="offer.imageUrl"
            alt=""
            loading="lazy"
            width="36"
            height="36"
          />
          <span>{{ label(offer) }}</span>
          <span v-if="offer.packLb" class="buy-links__pack">{{ offer.packLb }} lb</span>
          <span v-else-if="offer.packFlOz" class="buy-links__pack">
            {{ offer.packFlOz }} fl oz
          </span>
          <span v-if="isPaidLink(offer)" class="buy-links__paid">(paid link)</span>
          <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
        </a>
        <p v-if="offer.note" class="buy-links__hint">{{ offer.note }}</p>
      </li>
    </ul>
  </div>
</template>
