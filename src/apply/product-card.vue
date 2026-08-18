<script lang="ts">
import BuyLinks from './buy-links.vue'
import { productDisplayName, productTile } from './product-tile'
import type { PropType } from 'vue'
import type { ProductTile } from './product-tile'
import type { Product } from '../types'

/**
 * One product, shown as a thing you could pick off a shelf.
 *
 * The tile does the work a photograph would: it gives the eye something to
 * land on before any words are read, which is the whole reason this sits at
 * the top of the rail rather than buried in a list further down the page.
 *
 * Like the links inside it, this has no say in which products appear or in
 * what order — that stays with the label rates and the calendar.
 */
export default {
  name: 'ProductCard',
  components: { BuyLinks },
  props: {
    product: { type: Object as PropType<Product>, required: true },
    /** The job being read about, where there is one, so the tile matches it. */
    inTaskId: { type: String, default: '' },
  },
  computed: {
    tile(): ProductTile {
      return productTile(this.product, this.inTaskId)
    },
    displayName(): string {
      return productDisplayName(this.product)
    },
  },
}
</script>

<style lang="scss">
/*
 * Kept short on purpose. A feeding job lists seven of these, so every line
 * that isn't the product, what it does, or the way to buy it costs a card's
 * worth of column further down. The brand is the casualty: it is nearly always
 * the first word of the name anyway.
 */
.product-card {
  display: grid;
  gap: 0.5rem;
  padding: 0.7rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--border-radius) * 1.5);

  .product-card__head {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
  }

  .product-card__id {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  /*
   * Stands in for a product photo, at the size one would be. Amazon's terms
   * only allow their images to be served live from their API, so this is what
   * there is until that access exists — and it holds the square, so the swap
   * later moves nothing on the page.
   */
  .product-card__tile {
    position: relative;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 3rem;
    aspect-ratio: 1;
    overflow: hidden;
    background: color-mix(in srgb, var(--tile-ink) 10%, var(--color-white));
    border: 1px solid color-mix(in srgb, var(--tile-ink) 22%, transparent);
    border-radius: var(--border-radius);

    svg {
      width: 58%;
      height: 58%;
      color: var(--tile-ink);
    }

    &--default,
    &--feed {
      --tile-ink: var(--color-primary);
    }

    &--weeds {
      --tile-ink: var(--color-accent);
    }

    &--pests {
      --tile-ink: var(--color-info);
    }

    /* With numbers to print, the silhouette drops back and becomes the surface
       they are printed on, the way an analysis sits on a bag. */
    &--marked svg {
      width: 92%;
      height: 92%;
      opacity: 0.18;
    }
  }

  .product-card__analysis {
    position: absolute;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--tile-ink);
  }

  .product-card__name {
    margin: 0;
    font-size: 0.86rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .product-card__purpose {
    margin: 0;
    font-size: 0.76rem;
    line-height: 1.35;
    color: var(--color-text-muted);
  }
}
</style>

<template>
  <article class="product-card">
    <div class="product-card__head">
      <span
        class="product-card__tile"
        :class="[
          `product-card__tile--${tile.tone}`,
          { 'product-card__tile--marked': tile.analysis },
        ]"
        aria-hidden="true"
      >
        <font-awesome-icon :icon="tile.icon" />
        <span v-if="tile.analysis" class="product-card__analysis">{{ tile.analysis }}</span>
      </span>

      <div class="product-card__id">
        <p class="product-card__name">{{ displayName }}</p>
        <p class="product-card__purpose">{{ product.purpose }}</p>
      </div>
    </div>

    <BuyLinks :product-id="product.id" compact />
  </article>
</template>
