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

<script>
import { mapGetters } from 'vuex'
import LawnSizeInput from '../layout/LawnSizeInput.vue'
import { rateTemplates, sprayerMix } from '../../data/rates'

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
      mode: tmpl.mixMode || 'perGallon',
      ozPerGallon: override.ozPerGallon ?? tmpl.ozPerGallon ?? 2,
      ozPer1000: override.ozPer1000 ?? 2,
    }
  },
  computed: {
    ...mapGetters(['lawnSqFt', 'tankGallons', 'sprayCoverage']),
    tankGallonsLocal: {
      get() {
        return this.tankGallons
      },
      set(v) {
        this.$store.dispatch('updateEquipment', { tankGallons: Number(v) || 2 })
      },
    },
    coverageLocal: {
      get() {
        return this.sprayCoverage
      },
      set(v) {
        this.$store.dispatch('updateEquipment', {
          sprayCoverageSqFtPerTank: Number(v) || 1000,
        })
      },
    },
    result() {
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
    ozPerGallon(v) {
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

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.sprayer {
  @include card;
  padding: 1.15rem;

  &__controls {
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
      color: $color-ink-muted;
    }

    input,
    select {
      @include tap-target;
      border: 1px solid $color-border-strong;
      border-radius: $radius-sm;
      padding: 0.45rem 0.65rem;
      color: $color-ink;
      background: $color-surface;
      min-width: 7rem;

      &:focus-visible {
        @include focus-ring;
        border-color: $brand;
      }
    }
  }

  &__result {
    display: grid;
    gap: 0.75rem;

    @media (min-width: $bp-sm) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__stat {
    background: $color-surface-sunken;
    border-radius: $radius-md;
    padding: 0.85rem;

    span {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: $color-ink-muted;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    strong {
      font-family: $font-display;
      font-size: 1.25rem;
      font-variant-numeric: tabular-nums;
    }

    em {
      display: block;
      font-style: normal;
      font-size: 0.82rem;
      color: $color-ink-muted;
      margin-top: 0.2rem;
    }
  }

  &__note {
    margin: 0.85rem 0 0;
    font-size: 0.82rem;
    color: $color-ink-muted;
  }
}
</style>
