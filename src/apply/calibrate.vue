<script lang="ts">
import { calibration, testStripFt } from '../services/apply'
import { spreaderById } from '../data/spreaders'
import type { Calibration } from '../services/apply'

/**
 * Finding a dial number the bag doesn't print, by measuring instead of guessing.
 *
 * Spread over a strip you measured, weigh what left the hopper, and the rate
 * comes out of the arithmetic. The answer is a direction to move the dial —
 * "20% heavy" — because no two spreaders share a scale.
 */
export default {
  name: 'Calibrate',
  props: {
    spreaderId: { type: String, default: '' },
    targetPer1000: { type: Number, default: 0 },
  },
  data() {
    return {
      lbUsed: null as number | null,
      swathFt: null as number | null,
      distanceFt: null as number | null,
    }
  },
  computed: {
    suggestedSwath(): number {
      return spreaderById[this.spreaderId]?.swathFt || 6
    },
    suggestedDistance(): number {
      return testStripFt(this.spreaderId)
    },
    result(): Calibration | null {
      return calibration({
        lbUsed: this.lbUsed || 0,
        swathFt: this.swathFt || this.suggestedSwath,
        distanceFt: this.distanceFt || this.suggestedDistance,
        targetPer1000: this.targetPer1000,
      })
    },
  },
}
</script>

<style lang="scss">
.calibrate {
  padding: 1rem 1.1rem;
  background: var(--color-bg-soft);
  border: 1px dashed var(--color-border);
  border-radius: calc(var(--border-radius) * 1.5);

  .calibrate__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.5rem;

    h4 {
      margin: 0;
      font-family: var(--font-family);
      font-size: 0.95rem;
      font-weight: 700;
    }
  }

  ol {
    margin: 0 0 0.9rem;
    padding-left: 1.1rem;
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--color-text-muted);

    li + li {
      margin-top: 0.2rem;
    }
  }

  .calibrate__fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;

    @media (max-width: 559px) {
      grid-template-columns: 1fr;
    }

    label {
      display: grid;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    input {
      min-height: var(--input-height);
      padding: 0.4rem 0.6rem;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }
  }

  .calibrate__result {
    margin: 0.9rem 0 0;
    padding: 0.7rem 0.85rem;
    font-size: 0.88rem;
    background: var(--color-surface);
    border-left: 3px solid var(--color-border);
    border-radius: var(--border-radius);

    strong {
      font-variant-numeric: tabular-nums;
    }

    &--good {
      border-left-color: var(--color-success);
    }

    &--low {
      border-left-color: var(--color-info);
    }

    &--high {
      border-left-color: var(--color-danger);
    }
  }
}
</style>

<template>
  <div class="calibrate">
    <div class="calibrate__head">
      <h4>Find your setting</h4>
      <span class="hint">Target {{ targetPer1000 }} lb / 1,000 sq ft</span>
    </div>
    <ol>
      <li>
        Weigh out a few pounds, set the dial low, and spread a strip about
        {{ suggestedDistance }} ft long at your normal walking pace.
      </li>
      <li>Measure how wide the throw actually landed, and weigh what's left.</li>
      <li>Enter the three numbers — the pounds you used is start minus finish.</li>
    </ol>

    <div class="calibrate__fields">
      <label>
        <span>Product used (lb)</span>
        <input v-model.number="lbUsed" type="number" min="0" step="0.1" placeholder="2.5" />
      </label>
      <label>
        <span>Throw width (ft)</span>
        <input
          v-model.number="swathFt"
          type="number"
          min="1"
          step="0.5"
          :placeholder="String(suggestedSwath)"
        />
      </label>
      <label>
        <span>Strip length (ft)</span>
        <input
          v-model.number="distanceFt"
          type="number"
          min="10"
          step="5"
          :placeholder="String(suggestedDistance)"
        />
      </label>
    </div>

    <p v-if="result" class="calibrate__result" :class="`calibrate__result--${result.verdict}`">
      That pass put down <strong>{{ result.measuredPer1000.toFixed(2) }} lb</strong> per 1,000 sq
      ft. {{ result.advice }}
    </p>
    <p v-else class="hint calibrate__result">
      Enter what you used and how much ground it covered to see where the dial landed.
    </p>
  </div>
</template>
