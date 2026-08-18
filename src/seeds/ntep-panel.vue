<script lang="ts">
import BarChart from '../components/bar-chart.vue'
import SlimSelect from 'slim-select/vue'
import { ratingColor } from '../charts/bars'
import { cultivarsForSpecies, isNamedCultivar, ntepMetaForSpecies, NTEP_METRICS, siteCodesForMetric, type NtepMetricKey } from '../data/seedDb'
import { nearestNtepSites } from '../services/suitability'
import { fmtRating } from './fit-ui'
import type { PropType } from 'vue'
import type { BarDatum, Cultivar, NearbySite, SpeciesInfo, UserLocation } from '../types'

export default {
  name: 'NtepPanel',
  components: { BarChart, SlimSelect },
  props: {
    userLocation: { type: Object as PropType<UserLocation | null>, default: null },
    speciesId: { type: String, default: 'tall_fescue' },
    speciesOptions: { type: Array as PropType<SpeciesInfo[]>, default: () => [] },
  },
  emits: ['update:speciesId'],
  data() {
    return {
      metric: 'transitionQuality' as NtepMetricKey,
      namedOnly: true,
      view: 'means' as 'means' | 'sites',
      ntepMetrics: NTEP_METRICS,
    }
  },
  watch: {
    availableMetrics(metrics: { key: NtepMetricKey }[]) {
      if (!metrics.some((m) => m.key === this.metric)) this.metric = 'transitionQuality'
    },
  },
  computed: {
    poolBase(): Cultivar[] {
      return cultivarsForSpecies(this.speciesId)
    },
    qualitySites(): string[] {
      return siteCodesForMetric('transitionQuality', this.poolBase)
    },
    nearestSite(): NearbySite | null {
      if (!this.userLocation) return null
      return nearestNtepSites(this.userLocation.latitude, this.userLocation.longitude, 1, this.qualitySites)[0] || null
    },
    pool(): Cultivar[] {
      return this.namedOnly ? this.poolBase.filter(isNamedCultivar) : this.poolBase
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
      const meta = ntepMetaForSpecies(this.speciesId)
      if (!meta) return 'NTEP high-value tables: regional quality, color, disease, drought.'
      return `NTEP ${this.speciesId.replace(/_/g, ' ')} trial ${meta.trial}, ${meta.year} report (${meta.notes}).`
    },
    speciesChoice: {
      get(): string {
        return this.speciesId
      },
      set(id: string) {
        this.$emit('update:speciesId', id)
      },
    },
    speciesSelectData(): { text: string; value: string }[] {
      return this.speciesOptions.map((s) => ({ text: s.label, value: s.id }))
    },
    /**
     * Metrics this species' trial actually measured. The bluegrass report has no
     * drought or single-column disease table, and offering those would hand the
     * user an empty table with no reason given.
     */
    availableMetrics(): { key: NtepMetricKey; label: string; short: string }[] {
      return this.ntepMetrics.filter((m) =>
        this.poolBase.some((c) => c.metrics?.[m.key]?.mean != null),
      )
    },
    metricSelectData(): { text: string; value: string }[] {
      return this.availableMetrics.map((m) => ({ text: m.label, value: m.key }))
    },
    viewSelectData(): { text: string; value: string; disabled?: boolean }[] {
      return [
        { text: 'National / regional means', value: 'means' },
        { text: 'Nearest trial site', value: 'sites', disabled: !this.nearestSite },
      ]
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
      <div class="toolbar-control">
        <SlimSelect
          v-model="speciesChoice"
          :data="speciesSelectData"
          :settings="{ showSearch: false, allowDeselect: false }"
          aria-label="Species"
        />
      </div>
      <div class="toolbar-control">
        <SlimSelect
          :key="view"
          v-model="metric"
          :data="metricSelectData"
          :settings="{ showSearch: false, allowDeselect: false, disabled: view === 'sites' }"
          aria-label="Metric"
        />
      </div>
      <div class="toolbar-control">
        <SlimSelect
          v-model="view"
          :data="viewSelectData"
          :settings="{ showSearch: false, allowDeselect: false }"
          aria-label="Table view"
        />
      </div>
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
