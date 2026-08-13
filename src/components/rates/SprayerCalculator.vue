<template>
  <div class="sprayer">
    <div class="sprayer__controls">
      <label>
        <span>Mix mode</span>
        <select v-model="mode">
          <option value="perGallon">oz per gallon</option>
          <option value="per1000">oz per 1000 sq ft</option>
        </select>
      </label>
      <label>
        <span>Tank size (gal)</span>
        <input v-model.number="tankGallonsLocal" type="number" min="0.5" step="0.5" />
      </label>
      <label v-if="mode === 'perGallon'">
        <span>Product (fl oz / gal)</span>
        <input v-model.number="ozPerGallon" type="number" min="0" step="0.1" />
      </label>
      <label v-else>
        <span>Product (fl oz / 1000)</span>
        <input v-model.number="ozPer1000" type="number" min="0" step="0.1" />
      </label>
      <label>
        <span>Coverage per tank (sq ft)</span>
        <input v-model.number="coverageLocal" type="number" min="50" step="50" />
      </label>
      <LawnSizeInput />
    </div>

    <div class="sprayer__result">
      <div class="sprayer__stat">
        <span>Per tank</span>
        <strong>{{ result.productOzPerTank.toFixed(1) }} fl oz</strong>
        <em>in {{ result.waterGallonsPerTank }} gal water</em>
      </div>
      <div class="sprayer__stat">
        <span>Tanks for lawn</span>
        <strong>{{ result.tanksNeeded.toFixed(2) }}</strong>
      </div>
      <div class="sprayer__stat">
        <span>Total product</span>
        <strong>{{ result.totalProductOz.toFixed(1) }} fl oz</strong>
        <em>{{ (result.totalProductOz / 16).toFixed(2) }} pints</em>
      </div>
    </div>
    <p class="sprayer__note">
      Starting calculator only — confirm concentration and PPE on your product label before mixing.
      Tank size and coverage save in this browser.
    </p>
  </div>
</template>

<script lang="ts">
import LawnSizeInput from '../layout/LawnSizeInput.vue'
import { rateTemplates, sprayerMix } from '../../data/rates'
import type { MixMode, SprayerMixResult } from '../../types'

export default {
  name: 'SprayerCalculator',
  components: { LawnSizeInput },
  props: {
    rateKey: { type: String, default: 'glyphosate' },
  },
  data() {
    const tmpl = rateTemplates[this.rateKey] || rateTemplates.glyphosate
    const override = this.$store.state.rateOverrides[this.rateKey] || {}
    return {
      mode: (tmpl.mixMode || 'perGallon') as MixMode,
      ozPerGallon: override.ozPerGallon ?? tmpl.ozPerGallon ?? 2,
      ozPer1000: override.ozPer1000 ?? 2,
    }
  },
  computed: {
    lawnSqFt(): number {
      return this.$store.getters.lawnSqFt
    },
    tankGallons(): number {
      return this.$store.getters.tankGallons
    },
    sprayCoverage(): number {
      return this.$store.getters.sprayCoverage
    },
    tankGallonsLocal: {
      get(): number {
        return this.tankGallons
      },
      set(v: number) {
        this.$store.dispatch('updateEquipment', { tankGallons: Number(v) || 2 })
      },
    },
    coverageLocal: {
      get(): number {
        return this.sprayCoverage
      },
      set(v: number) {
        this.$store.dispatch('updateEquipment', {
          sprayCoverageSqFtPerTank: Number(v) || 1000,
        })
      },
    },
    result(): SprayerMixResult {
      return sprayerMix({
        mode: this.mode,
        tankGallons: this.tankGallons,
        ozPerGallon: this.ozPerGallon,
        ozPer1000: this.ozPer1000,
        coverageSqFtPerTank: this.sprayCoverage,
        targetSqFt: this.lawnSqFt,
      })
    },
  },
  watch: {
    ozPerGallon(v: number) {
      if (this.mode === 'perGallon') {
        this.$store.dispatch('setRateOverride', {
          rateKey: this.rateKey,
          values: { ozPerGallon: v },
        })
      }
    },
  },
}
</script>

<style lang="scss">
.sprayer {
  padding: 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--border-radius) * 2);
  box-shadow: var(--shadow);

  .sprayer__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem 1.25rem;
    margin-bottom: 1.15rem;

    label {
      display: inline-flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    input,
    select {
      min-width: 7rem;
      min-height: var(--input-height);
      padding: 0.45rem 0.65rem;
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

  .sprayer__result {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;

    @media (max-width: 559px) {
      grid-template-columns: 1fr;
    }
  }

  .sprayer__stat {
    padding: 0.85rem;
    background: var(--color-surface-alt);
    border-radius: calc(var(--border-radius) * 1.5);

    span {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    strong {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-variant-numeric: tabular-nums;
    }

    em {
      display: block;
      margin-top: 0.2rem;
      font-size: 0.82rem;
      font-style: normal;
      color: var(--color-text-muted);
    }
  }

  .sprayer__note {
    margin: 0.85rem 0 0;
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }
}
</style>
