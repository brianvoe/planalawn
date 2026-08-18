<script lang="ts">
import { ratingColor } from '../charts/bars'
import { fitMeters, fmtRating, ratingWidth } from './fit-ui'
import type { PropType } from 'vue'
import type { BlendFit, FitMeter, ScoreFactor } from '../types'

/**
 * The score behind a bag, as two or three bars you can read without stopping.
 *
 * Full 1-9 scale on every bar so cards stay comparable, with a mark for the
 * trial's average entry — that mark, not the bar length, is what tells you a
 * rating is strong, since ratings cluster within a point of each other.
 */
export default {
  name: 'FitMeters',
  props: {
    fit: { type: Object as PropType<BlendFit | null>, default: null },
    baselines: {
      type: Object as PropType<Partial<Record<ScoreFactor, number>>>,
      default: () => ({}),
    },
    /** True where regional quality tables apply, so the fallback row is named right. */
    regional: { type: Boolean, default: false },
  },
  computed: {
    meters(): FitMeter[] {
      return fitMeters(this.fit, this.baselines, this.regional)
    },
  },
  methods: {
    fmtRating,
    ratingWidth,
    ratingColor,
  },
}
</script>

<style lang="scss">
/* One short row of hairline bars: enough to compare bags at a glance without
   turning every card into a chart panel. */
.fit-meters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
  gap: 0.35rem 0.9rem;

  .fit-meters__meter {
    display: grid;
    gap: 0.22rem;
    min-width: 0;
    cursor: help;
  }

  .fit-meters__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.3rem;
  }

  .fit-meters__label {
    overflow: hidden;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fit-meters__track {
    position: relative;
    height: 0.2rem;
    background: var(--color-bg-soft);
    border-radius: 999px;
  }

  .fit-meters__fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    transform-origin: left center;
    animation: fit-meter-grow 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(70ms * var(--row, 0));
  }

  /* The trial's average entry. Taller than the track so it stays visible where
     the fill runs past it. */
  .fit-meters__mark {
    position: absolute;
    top: -0.14rem;
    bottom: -0.14rem;
    width: 1.5px;
    margin-left: -0.75px;
    background: color-mix(in srgb, var(--color-text) 32%, transparent);
  }

  .fit-meters__value {
    font-size: 0.7rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
  }
}

/* Inside a block that reveals on scroll, hold the bars at zero until it lands.
   Dropping the animation is what parks them there; restoring the name when the
   block is revealed starts the growth from the top. */
.reveal:not(.reveal--in) .fit-meters .fit-meters__fill {
  transform: scaleX(0);
  animation-name: none;
}

@keyframes fit-meter-grow {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fit-meters .fit-meters__fill {
    animation: none;
  }
}
</style>

<template>
  <div v-if="meters.length" class="fit-meters">
    <div
      v-for="(m, i) in meters"
      :key="m.key"
      class="fit-meters__meter"
      :style="{ '--row': i }"
      :title="m.hint"
    >
      <span class="fit-meters__head">
        <span class="fit-meters__label">{{ m.label }}</span>
        <span class="fit-meters__value">{{ fmtRating(m.value) }}</span>
      </span>
      <span class="fit-meters__track" aria-hidden="true">
        <span
          class="fit-meters__fill"
          :style="{ width: ratingWidth(m.value), background: ratingColor(m.value) }"
        />
        <span
          v-if="m.baseline != null"
          class="fit-meters__mark"
          :style="{ left: ratingWidth(m.baseline) }"
        />
      </span>
    </div>
  </div>
</template>
