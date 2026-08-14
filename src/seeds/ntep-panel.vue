<script lang="ts">
import BarChart from '../components/bar-chart.vue'
import { ratingColor } from '../charts/bars'
import { allCultivars, isNamedCultivar, NTEP_METRICS, siteCodesForMetric, type NtepMetricKey } from '../data/seedDb'
import { nearestNtepSites } from '../services/suitability'
import { fmtRating } from './fit-ui'
import type { PropType } from 'vue'
import type { BarDatum, Cultivar, NearbySite, UserLocation } from '../types'

const QUALITY_SITES = siteCodesForMetric('transitionQuality')

export default {
  name: 'NtepPanel',
  components: { BarChart },
  props: {
    userLocation: { type: Object as PropType<UserLocation | null>, default: null },
  },
  data() {
    return {
      metric: 'transitionQuality' as NtepMetricKey,
      namedOnly: true,
      view: 'means' as 'means' | 'sites',
      ntepMetrics: NTEP_METRICS,
    }
  },
  computed: {
    nearestSite(): NearbySite | null {
      if (!this.userLocation) return null
      return nearestNtepSites(this.userLocation.latitude, this.userLocation.longitude, 1, QUALITY_SITES)[0] || null
    },
    pool(): Cultivar[] {
      return this.namedOnly ? allCultivars.filter(isNamedCultivar) : allCultivars
    },
    ranked(): { cultivar: Cultivar; value: number }[] {
      return this.pool
        .map((cultivar) => {
          let value: number | null | undefined
          if (this.view === 'sites' && this.nearestSite) {
            value = cultivar.metrics?.transitionQuality?.bySite?.[this.nearestSite.code]
          } else {
            value = cultivar.metrics?.[this.metric]?.mean
          }
          return { cultivar, value: typeof value === 'number' ? value : null }
        })
        .filter((row): row is { cultivar: Cultivar; value: number } => row.value != null)
        .sort((a, b) => b.value - a.value)
    },
    chartData(): BarDatum[] {
      return this.ranked.slice(0, 15).map((row) => ({
        label: row.cultivar.name,
        value: row.value,
        color: ratingColor(row.value),
      }))
    },
    metricLabel(): string {
      if (this.view === 'sites' && this.nearestSite) return `Quality at ${this.nearestSite.name}`
      return this.ntepMetrics.find((m) => m.key === this.metric)?.label || this.metric
    },
    sourceLine(): string {
      return 'NTEP tall fescue trial tf18, 2023 report (high-value tables: regional quality, color, brown patch, drought).'
    },
  },
  methods: {
    fmtRating,
  },
}
</script>

<style lang="scss">
.ntep-panel {
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .named-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .data-table-wrap {
    max-height: 32rem;
    overflow: auto;
    margin-top: 1.25rem;
  }
}
</style>

<template>
  <section class="ntep-panel">
    <div class="card">
      <h2>NTEP explorer</h2>
      <p class="hint">{{ sourceLine }}</p>
    </div>

    <div class="toolbar">
      <select v-model="metric" class="select" :disabled="view === 'sites'">
        <option v-for="m in ntepMetrics" :key="m.key" :value="m.key">{{ m.label }}</option>
      </select>
      <select v-model="view" class="select">
        <option value="means">National / regional means</option>
        <option value="sites" :disabled="!nearestSite">Nearest trial site</option>
      </select>
      <label class="named-toggle">
        <input v-model="namedOnly" type="checkbox" />
        Named grasses only
      </label>
    </div>

    <div v-if="chartData.length" class="chart-panel">
      <h3 class="chart-panel__title">Top 15 — {{ metricLabel }}</h3>
      <p class="chart-panel__meta">1–9 NTEP scale. Higher is better (including brown patch, where higher = less disease).</p>
      <BarChart :data="chartData" :options="{ leftMargin: 140, rowHeight: 30 }" />
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cultivar</th>
            <th>{{ metricLabel }}</th>
            <th>Transition</th>
            <th>Drought</th>
            <th>Brown patch</th>
            <th>Color</th>
            <th>National</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in ranked" :key="row.cultivar.id">
            <td class="num">{{ i + 1 }}</td>
            <td><strong>{{ row.cultivar.name }}</strong></td>
            <td class="num">{{ fmtRating(row.value) }}</td>
            <td class="num">{{ fmtRating(row.cultivar.metrics?.transitionQuality?.mean) }}</td>
            <td class="num">{{ fmtRating(row.cultivar.metrics?.droughtQuality?.mean) }}</td>
            <td class="num">{{ fmtRating(row.cultivar.metrics?.brownPatch?.mean) }}</td>
            <td class="num">{{ fmtRating(row.cultivar.metrics?.geneticColor?.mean) }}</td>
            <td class="num">{{ fmtRating(row.cultivar.metrics?.nationalMeanQuality?.mean) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
