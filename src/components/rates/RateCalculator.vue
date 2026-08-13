<template>
  <div class="rate-calc">
    <div class="rate-calc__controls">
      <LawnSizeInput />
      <label v-if="showDepth">
        <span>Depth (inches)</span>
        <input v-model.number="depthInches" type="number" min="0.1" step="0.1" />
      </label>
      <label v-if="showPer1000">
        <span>Rate / 1000 sq ft ({{ unit }})</span>
        <input v-model.number="per1000" type="number" min="0" step="0.1" />
      </label>
      <label v-if="altOptions.length" class="rate-calc__select">
        <span>Product template</span>
        <select v-model="selectedKey">
          <option v-for="opt in altOptions" :key="opt.id" :value="opt.id">
            {{ opt.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="rate-calc__result">
      <template v-if="mode === 'coverage'">
        <p>
          Apply about
          <strong>{{ amountLabel }}</strong>
          across
          <strong>{{ lawnSqFt.toLocaleString() }} sq ft</strong>
          ({{ per1000 }} {{ unit }} / 1000).
        </p>
      </template>
      <template v-else-if="mode === 'volume'">
        <p>
          Roughly
          <strong>{{ volumeLabel }} cubic yards</strong>
          at {{ depthInches }}″ over
          <strong>{{ lawnSqFt.toLocaleString() }} sq ft</strong>.
        </p>
      </template>
      <p v-if="notes" class="rate-calc__notes">{{ notes }}</p>
      <p class="rate-calc__notes">Edited rates save in this browser for next time.</p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import LawnSizeInput from '../layout/LawnSizeInput.vue'
import { rateTemplates, amountFromPer1000, volumeCubicYards } from '../../data/rates'

export default {
  name: 'RateCalculator',
  components: { LawnSizeInput },
  props: {
    mode: { type: String, required: true },
    rateKey: { type: String, required: true },
    altRateKey: { type: String, default: null },
  },
  data() {
    return {
      selectedKey: this.rateKey,
    }
  },
  computed: {
    ...mapGetters(['lawnSqFt']),
    template() {
      return rateTemplates[this.selectedKey] || rateTemplates[this.rateKey]
    },
    override() {
      return this.$store.state.rateOverrides[this.selectedKey] || {}
    },
    per1000: {
      get() {
        return this.override.per1000 ?? this.template?.per1000 ?? 0
      },
      set(v) {
        this.$store.dispatch('setRateOverride', {
          rateKey: this.selectedKey,
          values: { per1000: Number(v) },
        })
      },
    },
    depthInches: {
      get() {
        return this.override.depthInches ?? this.template?.depthInches ?? 0.25
      },
      set(v) {
        this.$store.dispatch('setRateOverride', {
          rateKey: this.selectedKey,
          values: { depthInches: Number(v) },
        })
      },
    },
    unit() {
      return this.template?.unit || 'lb'
    },
    altOptions() {
      const keys = [this.rateKey, this.altRateKey].filter(Boolean)
      return keys.map((k) => rateTemplates[k]).filter(Boolean)
    },
    showPer1000() {
      return this.mode === 'coverage'
    },
    showDepth() {
      return this.mode === 'volume'
    },
    notes() {
      return this.template?.notes || ''
    },
    amountLabel() {
      return `${amountFromPer1000(this.lawnSqFt, this.per1000).toFixed(1)} ${this.unit}`
    },
    volumeLabel() {
      return volumeCubicYards(this.lawnSqFt, this.depthInches).toFixed(2)
    },
  },
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.rate-calc {
  @include card;
  padding: 1.15rem;

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem 1.25rem;
    margin-bottom: 1rem;

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
    p {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    strong {
      font-variant-numeric: tabular-nums;
    }
  }

  &__notes {
    font-size: 0.85rem !important;
    color: $color-ink-muted;
  }
}
</style>
