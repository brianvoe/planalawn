<script lang="ts">
import LawnSize from '../components/lawn-size.vue'
import { rateTemplates, amountFromPer1000, volumeCubicYards } from '../data/rates'
import type { PropType } from 'vue'
import type { RateTemplate } from '../types'

export default {
  name: 'RateCalculator',
  components: { LawnSize },
  props: {
    mode: { type: String, required: true },
    rateKey: { type: String, required: true },
    altRateKey: { type: String, default: null },
    rateKeys: { type: Array as PropType<string[] | null>, default: null },
  },
  data() {
    return {
      selectedKey: this.rateKey,
    }
  },
  computed: {
    lawnSqFt(): number {
      return this.$store.getters.lawnSqFt
    },
    template(): RateTemplate | undefined {
      return rateTemplates[this.selectedKey] || rateTemplates[this.rateKey]
    },
    override() {
      return this.$store.state.rateOverrides[this.selectedKey] || {}
    },
    per1000: {
      get(): number {
        return this.override.per1000 ?? this.template?.per1000 ?? 0
      },
      set(v: number) {
        this.$store.dispatch('setRateOverride', {
          rateKey: this.selectedKey,
          values: { per1000: Number(v) },
        })
      },
    },
    depthInches: {
      get(): number {
        return this.override.depthInches ?? this.template?.depthInches ?? 0.25
      },
      set(v: number) {
        this.$store.dispatch('setRateOverride', {
          rateKey: this.selectedKey,
          values: { depthInches: Number(v) },
        })
      },
    },
    unit(): string {
      return this.template?.unit || 'lb'
    },
    altOptions(): RateTemplate[] {
      const extra = this.rateKeys
      const keys =
        extra && extra.length > 0
          ? extra
          : [this.rateKey, this.altRateKey].filter((k): k is string => Boolean(k))
      const unique = [...new Set(keys)]
      return unique.map((k) => rateTemplates[k]).filter((t): t is RateTemplate => Boolean(t))
    },
    showPer1000(): boolean {
      return this.mode === 'coverage'
    },
    showDepth(): boolean {
      return this.mode === 'volume'
    },
    notes(): string {
      return this.template?.notes || ''
    },
    amountLabel(): string {
      return `${amountFromPer1000(this.lawnSqFt, this.per1000).toFixed(1)} ${this.unit}`
    },
    volumeLabel(): string {
      return volumeCubicYards(this.lawnSqFt, this.depthInches).toFixed(2)
    },
  },
}
</script>

<style lang="scss">
.rate-calc {
  padding: 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--border-radius) * 2);
  box-shadow: var(--shadow);

  .rate-calc__controls {
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

  .rate-calc__result {
    p {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    strong {
      font-variant-numeric: tabular-nums;
    }
  }

  .rate-calc__notes {
    font-size: 0.85rem !important;
    color: var(--color-text-muted);
  }
}
</style>

<template>
  <div class="rate-calc">
    <div class="rate-calc__controls">
      <LawnSize />
      <label v-if="showDepth">
        <span>Depth (inches)</span>
        <input v-model.number="depthInches" type="number" min="0.1" step="0.1" />
      </label>
      <label v-if="showPer1000">
        <span>Rate / 1000 sq ft ({{ unit }})</span>
        <input v-model.number="per1000" type="number" min="0" step="0.1" />
      </label>
      <label v-if="altOptions.length > 1" class="rate-calc__select">
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
