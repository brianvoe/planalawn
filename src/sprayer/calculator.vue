<script lang="ts">
import LawnSize from '../components/lawn-size.vue'
import SlimSelect from 'slim-select/vue'
import { rateTemplates, sprayerMix } from '../data/rates'
import type { PropType } from 'vue'
import type { MixMode, RateTemplate, SprayerMixResult } from '../types'

export default {
  name: 'Calculator',
  components: { LawnSize, SlimSelect },
  props: {
    rateKey: { type: String, default: 'glyphosate' },
    rateKeys: { type: Array as PropType<string[] | null>, default: null },
  },
  data() {
    const initial = this.rateKey
    const tmpl = rateTemplates[initial] || rateTemplates.glyphosate
    const override = this.$store.state.rateOverrides[initial] || {}
    return {
      selectedKey: initial,
      mode: (tmpl.mixMode || 'perGallon') as MixMode,
      ozPerGallon: override.ozPerGallon ?? tmpl.ozPerGallon ?? 2,
      ozPer1000: override.ozPer1000 ?? tmpl.ozPer1000 ?? 2,
    }
  },
  watch: {
    selectedKey(key: string) {
      const tmpl = rateTemplates[key] || rateTemplates.glyphosate
      const override = this.$store.state.rateOverrides[key] || {}
      this.mode = (tmpl.mixMode || 'perGallon') as MixMode
      this.ozPerGallon = override.ozPerGallon ?? tmpl.ozPerGallon ?? 2
      this.ozPer1000 = override.ozPer1000 ?? tmpl.ozPer1000 ?? 2
    },
    ozPerGallon(v: number) {
      if (this.mode === 'perGallon') {
        this.$store.dispatch('setRateOverride', {
          rateKey: this.selectedKey,
          values: { ozPerGallon: v },
        })
      }
    },
    ozPer1000(v: number) {
      if (this.mode === 'per1000') {
        this.$store.dispatch('setRateOverride', {
          rateKey: this.selectedKey,
          values: { ozPer1000: v },
        })
      }
    },
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
    productOptions(): RateTemplate[] {
      const extra = this.rateKeys
      const keys = extra && extra.length > 0 ? extra : [this.rateKey]
      const unique = [...new Set(keys)]
      return unique.map((k) => rateTemplates[k]).filter((t): t is RateTemplate => Boolean(t))
    },
    productNotes(): string {
      return rateTemplates[this.selectedKey]?.notes || ''
    },
    productSelectData(): { text: string; value: string }[] {
      return this.productOptions.map((opt) => ({ text: opt.label, value: opt.id }))
    },
    modeSelectData(): { text: string; value: MixMode }[] {
      return [
        { text: 'oz per gallon', value: 'perGallon' },
        { text: 'oz per 1000 sq ft', value: 'per1000' },
      ]
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
      min-width: 10rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    input {
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

<template>
  <div class="sprayer">
    <div class="sprayer__controls">
      <label v-if="productOptions.length > 1">
        <span>Product template</span>
        <SlimSelect
          v-model="selectedKey"
          :data="productSelectData"
          :settings="{ showSearch: false, allowDeselect: false }"
        />
      </label>
      <label>
        <span>Mix mode</span>
        <SlimSelect
          v-model="mode"
          :data="modeSelectData"
          :settings="{ showSearch: false, allowDeselect: false }"
        />
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
      <LawnSize />
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
    <p v-if="productNotes" class="sprayer__note">{{ productNotes }}</p>
    <p class="sprayer__note">
      Starting calculator only — confirm concentration and PPE on your product label before mixing.
      Tank size and coverage save in this browser.
    </p>
  </div>
</template>
