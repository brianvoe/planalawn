<script lang="ts">
import BarChart from '../components/bar-chart.vue'
import { ratingColor } from '../charts/bars'
import { scoreBlendForLocation } from '../services/suitability'
import { fitTone } from './fit-ui'
import type { PropType } from 'vue'
import type { BarDatum, Blend, BlendFit, Cultivar, UserLocation } from '../types'

export default {
  name: 'ComparePanel',
  components: { BarChart },
  props: {
    blends: { type: Array as PropType<Blend[]>, required: true },
    cultivarIndex: { type: Object as PropType<Record<string, Cultivar>>, required: true },
    userLocation: { type: Object as PropType<UserLocation | null>, default: null },
    ids: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['update:ids'],
  data() {
    return {
      fitCache: {} as Record<string, BlendFit>,
    }
  },
  computed: {
    picked(): Blend[] {
      return this.ids.map((id) => this.blends.find((b) => b.id === id)).filter((b): b is Blend => Boolean(b))
    },
    fitChart(): BarDatum[] {
      return this.picked
        .map((b) => {
          const fit = this.fitFor(b)
          return {
            label: b.name,
            value: fit?.score ?? 0,
            color: ratingColor(fit?.score),
          }
        })
        .filter((d) => d.value > 0)
    },
    droughtChart(): BarDatum[] {
      return this.traitBars('drought')
    },
    brownChart(): BarDatum[] {
      return this.traitBars('brownPatch')
    },
    colorChart(): BarDatum[] {
      return this.traitBars('color')
    },
  },
  methods: {
    fitTone,
    fitFor(blend: Blend | null): BlendFit | null {
      if (!blend) return null
      const key = `${blend.id}:${this.userLocation?.latitude}:${this.userLocation?.longitude}`
      if (!this.fitCache[key]) {
        this.fitCache[key] = scoreBlendForLocation(blend, this.cultivarIndex, this.userLocation)
      }
      return this.fitCache[key]
    },
    traitBars(key: 'drought' | 'brownPatch' | 'color'): BarDatum[] {
      return this.picked
        .map((b) => {
          const value = this.fitFor(b)?.averages?.[key]
          return { label: b.name, value: value ?? 0, color: ratingColor(value) }
        })
        .filter((d) => d.value > 0)
    },
    setSlot(index: number, event: Event) {
      const next = [...this.ids]
      next[index] = (event.target as HTMLSelectElement).value
      this.$emit('update:ids', next)
    },
  },
}
</script>

<style lang="scss">
.compare-panel {
  .compare-picks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .compare-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem;
    margin-bottom: 1.25rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }

    ul {
      margin: 0.5rem 0 0;
      padding-left: 1.1rem;
      font-size: 0.88rem;
    }

    .warn {
      color: var(--color-warning);
    }
  }

  .chart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<template>
  <section class="compare-panel">
    <p class="hint">Pick up to 3 blends. Charts use your location when it is set.</p>
    <div class="compare-picks">
      <label v-for="slot in 3" :key="slot" class="field">
        <span>Blend {{ slot }}</span>
        <select class="select" :value="ids[slot - 1]" @change="setSlot(slot - 1, $event)">
          <option value="">—</option>
          <option v-for="b in blends" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </label>
    </div>

    <div class="compare-grid">
      <div v-for="b in picked" :key="b.id" class="card">
        <h3>{{ b.name }}</h3>
        <p class="mfr">{{ b.manufacturer }}</p>
        <p class="fit" :class="fitTone(fitFor(b)?.score)">
          {{ fitFor(b)?.label }}
          <strong v-if="fitFor(b)?.score">{{ fitFor(b)?.score }}</strong>
        </p>
        <ul>
          <li v-for="s in fitFor(b)?.strengths || []" :key="s">{{ s }}</li>
        </ul>
        <ul class="warn">
          <li v-for="w in fitFor(b)?.watchouts || []" :key="w">{{ w }}</li>
        </ul>
      </div>
    </div>

    <div v-if="fitChart.length" class="chart-grid">
      <div class="chart-panel">
        <h3 class="chart-panel__title">Area fit</h3>
        <BarChart :data="fitChart" :options="{ leftMargin: 120, rowHeight: 36 }" />
      </div>
      <div class="chart-panel">
        <h3 class="chart-panel__title">Drought</h3>
        <BarChart :data="droughtChart" :options="{ leftMargin: 120, rowHeight: 36 }" />
      </div>
      <div class="chart-panel">
        <h3 class="chart-panel__title">Brown patch</h3>
        <BarChart :data="brownChart" :options="{ leftMargin: 120, rowHeight: 36 }" />
      </div>
      <div class="chart-panel">
        <h3 class="chart-panel__title">Genetic color</h3>
        <BarChart :data="colorChart" :options="{ leftMargin: 120, rowHeight: 36 }" />
      </div>
    </div>
  </section>
</template>
