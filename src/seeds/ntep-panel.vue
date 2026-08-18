<script lang="ts">
import BarChart from '../components/bar-chart.vue'
import SlimSelect from 'slim-select/vue'
import { ratingColor } from '../charts/bars'
import { cultivarsForSpecies, isNamedCultivar, ntepMetaForSpecies, NTEP_METRICS, siteCodesForMetric, type NtepMetricKey } from '../data/seedDb'
import { nearestNtepSites } from '../services/suitability'
import { fmtRating } from './fit-ui'
import type { PropType } from 'vue'
import type { BarDatum, Cultivar, NearbySite, SpeciesInfo, UserLocation } from '../types'

/**
 * Ranking on the trial site nearest the user instead of on a metric mean.
 *
 * It sits in the same list as the metrics because it answers the same question
 * the metrics do — which number is this table sorted on. Splitting it into its
 * own dropdown meant one control had to silently disable another.
 */
const NEAREST_SITE = 'nearestSite'

type RankKey = NtepMetricKey | typeof NEAREST_SITE

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
      rankBy: 'transitionQuality' as RankKey,
      namedOnly: true,
      ntepMetrics: NTEP_METRICS,
    }
  },
  watch: {
    /**
     * Trials differ in what they measured, so changing species can remove the
     * column being ranked on. Falling back to the first column this species
     * does have keeps the table populated — a fixed fallback to regional
     * quality emptied it for trials that never ran one, such as paspalum.
     */
    rankableKeys(keys: RankKey[]) {
      if (!keys.includes(this.rankBy)) this.rankBy = keys[0] || 'transitionQuality'
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
    /** Every column this trial can show, which is also everything it can sort on. */
    columns(): { key: RankKey; label: string }[] {
      const columns = this.availableMetrics.map((m) => ({ key: m.key as RankKey, label: m.short }))
      if (this.nearestSite) {
        columns.push({ key: NEAREST_SITE, label: `Nearest — ${this.nearestSite.name}` })
      }
      return columns
    },
    rankableKeys(): RankKey[] {
      return this.columns.map((c) => c.key)
    },
    rankSelectData(): { text: string; value: string; disabled?: boolean }[] {
      const options: { text: string; value: string; disabled?: boolean }[] = this.availableMetrics.map(
        (m) => ({ text: m.label, value: m.key }),
      )
      options.push({
        text: this.nearestSite
          ? `Quality at ${this.nearestSite.name}`
          : 'Quality at your nearest site — set a location',
        value: NEAREST_SITE,
        disabled: !this.nearestSite,
      })
      return options
    },
    rankLabel(): string {
      return this.rankSelectData.find((o) => o.value === this.rankBy)?.text || this.rankBy
    },
    ranked(): { cultivar: Cultivar; value: number }[] {
      return this.pool
        .map((cultivar) => ({ cultivar, value: this.valueFor(cultivar, this.rankBy) }))
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
    /** Brown patch is scored so that high means healthy, which reads backwards. */
    hasDiseaseColumn(): boolean {
      return this.availableMetrics.some((m) => m.key === 'brownPatch')
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
  },
  methods: {
    fmtRating,
    valueFor(cultivar: Cultivar, key: RankKey): number | null {
      if (key === NEAREST_SITE) {
        const site = this.nearestSite
        const value = site ? cultivar.metrics?.transitionQuality?.bySite?.[site.code] : null
        return typeof value === 'number' ? value : null
      }
      const value = cultivar.metrics?.[key]?.mean
      return typeof value === 'number' ? value : null
    },
  },
}
</script>

<style lang="scss">
.ntep-panel {
  .panel-head {
    margin-bottom: 1.1rem;

    h2 {
      margin: 0 0 0.3rem;
      font-size: 1.4rem;
    }

    .hint {
      max-width: 46rem;
    }
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .named-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding-bottom: 0.7rem;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .data-table-wrap {
    max-height: 32rem;
    overflow: auto;
    margin-top: 1.25rem;
  }

  /* The sorted column, so the ranking is traceable across a wide table. */
  .data-table {
    th.col-active {
      color: var(--color-text);
      background: var(--color-bg-soft);
    }

    td.col-active {
      font-weight: 700;
      background: var(--color-bg-soft);
    }
  }

  .table-note {
    margin-top: 0.6rem;
  }
}
</style>

<template>
  <section class="ntep-panel">
    <header class="panel-head">
      <h2>NTEP explorer</h2>
      <p class="hint">{{ sourceLine }}</p>
    </header>

    <div class="toolbar">
      <label class="toolbar-field">
        <span>Species</span>
        <SlimSelect
          v-model="speciesChoice"
          :data="speciesSelectData"
          :settings="{ showSearch: false, allowDeselect: false }"
          aria-label="Species"
        />
      </label>
      <label class="toolbar-field">
        <span>Rank by</span>
        <SlimSelect
          v-model="rankBy"
          :data="rankSelectData"
          :settings="{ showSearch: false, allowDeselect: false }"
          aria-label="Rank by"
        />
      </label>
      <label class="named-toggle">
        <input v-model="namedOnly" type="checkbox" />
        Named grasses only
      </label>
    </div>

    <div v-if="chartData.length" class="chart-panel">
      <h3 class="chart-panel__title">Top 15 — {{ rankLabel }}</h3>
      <p class="chart-panel__meta">
        1–9 NTEP scale, higher is better<template v-if="hasDiseaseColumn">, including brown patch, where a high
        score means less disease</template>.
      </p>
      <BarChart :data="chartData" :options="{ leftMargin: 140, rowHeight: 30 }" />
    </div>

    <p v-if="!ranked.length" class="hint table-note">
      This trial published no ratings for {{ rankLabel }} among the grasses shown. Try another column, or uncheck
      “Named grasses only” to include experimental entries.
    </p>

    <template v-else>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cultivar</th>
              <th
                v-for="col in columns"
                :key="col.key"
                :class="{ 'col-active': col.key === rankBy }"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in ranked" :key="row.cultivar.id">
              <td class="num">{{ i + 1 }}</td>
              <td>
                <strong>{{ row.cultivar.name }}</strong>
              </td>
              <td
                v-for="col in columns"
                :key="col.key"
                class="num"
                :class="{ 'col-active': col.key === rankBy }"
              >
                {{ fmtRating(valueFor(row.cultivar, col.key)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="hint table-note">
        {{ ranked.length }} grasses ranked by {{ rankLabel }}, best first. A dash means the trial did not publish
        that rating for that grass.
      </p>
    </template>
  </section>
</template>
